#!/bin/bash
set -e

TASKS_FILE="docs/tasks.json"
RALPH_START_TIME=$(date +%s)

# ── Colors & Symbols ─────────────────────────────────────────────
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
BG_BLUE='\033[44m'

# ── Helpers ───────────────────────────────────────────────────────
timestamp() { date "+%H:%M:%S"; }
datestamp() { date "+%Y-%m-%d %H:%M:%S"; }

fmt_duration() {
    local secs=$1
    local h=$((secs / 3600))
    local m=$(( (secs % 3600) / 60 ))
    local s=$((secs % 60))
    if [[ $h -gt 0 ]]; then
        printf "%dh %02dm %02ds" "$h" "$m" "$s"
    elif [[ $m -gt 0 ]]; then
        printf "%dm %02ds" "$m" "$s"
    else
        printf "%ds" "$s"
    fi
}

elapsed_total() {
    local now=$(date +%s)
    fmt_duration $(( now - RALPH_START_TIME ))
}

line() {
    printf "${DIM}%.0s─${RESET}" {1..60}
    echo
}

header() {
    echo
    printf "${BG_BLUE}${WHITE} %-58s ${RESET}\n" "$1"
}

info()    { echo -e "${CYAN}  $1${RESET}"; }
success() { echo -e "${GREEN}  $1${RESET}"; }
warn()    { echo -e "${YELLOW}  $1${RESET}"; }
fail()    { echo -e "${RED}  $1${RESET}"; }

# ── Task info from JSON ──────────────────────────────────────────
get_next_task_info() {
    # Returns: id|priority|category|description
    # Separate calls print acceptance_criteria / test_steps / deps
    python3 -c "
import json, sys
with open('$TASKS_FILE') as f:
    data = json.load(f)
done_ids = {t['id'] for t in data['tasks'] if t['status'] == 'done'}
priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
pending = [t for t in data['tasks'] if t['status'] == 'pending']
pending.sort(key=lambda t: priority_order.get(t.get('priority', 'low'), 99))
for t in pending:
    deps = t.get('dependencies', [])
    if all(d in done_ids for d in deps):
        print(t['id'])
        print(t.get('priority', '?'))
        print(t.get('category', '?'))
        print(t['description'])
        print('---AC---')
        for ac in t.get('acceptance_criteria', []):
            print(ac)
        print('---TS---')
        for ts in t.get('test_steps', []):
            print(ts)
        print('---DEP---')
        for d in deps:
            status = 'done' if d in done_ids else 'pending'
            print(f'{d} ({status})')
        sys.exit(0)
print('NONE')
" 2>/dev/null || echo "NONE"
}

print_task_card() {
    local raw="$1"

    if [[ "$raw" == "NONE" ]]; then
        return 1
    fi

    local task_id priority category description
    local section="header"
    local ac_lines=()
    local ts_lines=()
    local dep_lines=()
    local line_num=0

    while IFS= read -r l; do
        ((line_num++))
        case $line_num in
            1) task_id="$l" ;;
            2) priority="$l" ;;
            3) category="$l" ;;
            4) description="$l" ;;
            *)
                case "$l" in
                    "---AC---")  section="ac" ; continue ;;
                    "---TS---")  section="ts" ; continue ;;
                    "---DEP---") section="dep"; continue ;;
                esac
                case "$section" in
                    ac)  ac_lines+=("$l") ;;
                    ts)  ts_lines+=("$l") ;;
                    dep) dep_lines+=("$l") ;;
                esac
                ;;
        esac
    done <<< "$raw"

    # Priority color
    local pri_color="$DIM"
    case "$priority" in
        critical) pri_color="$RED$BOLD" ;;
        high)     pri_color="$YELLOW$BOLD" ;;
        medium)   pri_color="$CYAN" ;;
        low)      pri_color="$DIM" ;;
    esac

    echo
    echo -e "  ${WHITE}${BOLD}>> $task_id${RESET}  ${pri_color}$priority${RESET}  ${DIM}[$category]${RESET}"
    echo
    echo -e "  ${BOLD}Описание:${RESET}"
    echo -e "  $description"

    if [[ ${#ac_lines[@]} -gt 0 ]]; then
        echo
        echo -e "  ${BOLD}Критерии приемки:${RESET}"
        for ac in "${ac_lines[@]}"; do
            echo -e "  ${GREEN}  ○${RESET} $ac"
        done
    fi

    if [[ ${#ts_lines[@]} -gt 0 ]]; then
        echo
        echo -e "  ${BOLD}Тест-шаги:${RESET}"
        for ts in "${ts_lines[@]}"; do
            echo -e "  ${CYAN}  ▸${RESET} $ts"
        done
    fi

    if [[ ${#dep_lines[@]} -gt 0 ]]; then
        echo
        echo -e "  ${DIM}Зависимости:${RESET}"
        for dep in "${dep_lines[@]}"; do
            echo -e "  ${DIM}    $dep${RESET}"
        done
    fi

    # Export for later use
    CURRENT_TASK_ID="$task_id"
}

get_task_counts() {
    python3 -c "
import json
with open('$TASKS_FILE') as f:
    tasks = json.load(f)['tasks']
total = len(tasks)
done = sum(1 for t in tasks if t['status'] == 'done')
pending = sum(1 for t in tasks if t['status'] == 'pending')
other = total - done - pending
print(f'{total}|{done}|{pending}|{other}')
" 2>/dev/null || echo "?|?|?|?"
}

progress_bar() {
    local done=$1 total=$2 width=30
    if [[ $total -eq 0 ]]; then
        printf "[%-${width}s] 0%%" ""
        return
    fi
    local pct=$(( done * 100 / total ))
    local filled=$(( done * width / total ))
    local empty=$(( width - filled ))
    printf "${GREEN}"
    printf "["
    printf '%0.s█' $(seq 1 $filled 2>/dev/null) || true
    printf "${DIM}"
    printf '%0.s░' $(seq 1 $empty 2>/dev/null) || true
    printf "${RESET}${GREEN}] %d%%${RESET}" "$pct"
}

# ── Agent resolution ──────────────────────────────────────────────
build_agent_order() {
    local agents=()

    if [[ -n "${RALPH_AGENT:-}" ]]; then
        agents+=("$RALPH_AGENT")
        case "$RALPH_AGENT" in
            claude) command -v codex >/dev/null 2>&1 && agents+=("codex") ;;
            codex)  command -v claude >/dev/null 2>&1 && agents+=("claude") ;;
        esac
    else
        command -v claude >/dev/null 2>&1 && agents+=("claude")
        command -v codex  >/dev/null 2>&1 && agents+=("codex")
    fi

    if [[ ${#agents[@]} -eq 0 ]]; then
        fail "Не найден поддерживаемый агент. Установите 'claude' или 'codex', либо задайте RALPH_AGENT."
        return 1
    fi

    echo "${agents[@]}"
}

run_single_agent() {
    local agent="$1"
    local prompt="$2"

    case "$agent" in
        claude)
            claude --dangerously-skip-permissions -p "$prompt"
            ;;
        codex)
            local output_file
            output_file="$(mktemp -t ralph_codex.XXXXXX)"
            codex exec --full-auto --color never -C "$PWD" --output-last-message "$output_file" "$prompt" >/dev/null
            cat "$output_file"
            rm -f "$output_file"
            ;;
        *)
            fail "Unsupported agent: $agent"
            return 1
            ;;
    esac
}

run_agent_with_fallback() {
    local prompt="$1"
    shift
    local agents=("$@")
    local idx=0
    local total=${#agents[@]}

    for agent in "${agents[@]}"; do
        ((idx++))
        info "Агент: ${BOLD}$agent${RESET}${CYAN} ($idx/$total)"

        local result
        if result=$(run_single_agent "$agent" "$prompt" 2>&1); then
            USED_AGENT="$agent"
            echo "$result"
            return 0
        fi

        local exit_code=$?
        echo >&2
        warn "Агент '${BOLD}$agent${RESET}${YELLOW}' упал (exit $exit_code)"
        echo "$result" | tail -5 | while IFS= read -r l; do
            echo -e "${DIM}    $l${RESET}" >&2
        done

        if [[ $idx -lt $total ]]; then
            warn "Переключаюсь на fallback..."
        fi
    done

    fail "Все агенты упали."
    return 1
}

# ── Check for pending tasks ───────────────────────────────────────
has_pending_tasks() {
    local pending_count
    pending_count=$(grep -c '"status": "pending"' "$TASKS_FILE" 2>/dev/null) || pending_count=0
    [ "$pending_count" -gt 0 ]
}

# ── Banner ────────────────────────────────────────────────────────
clear
echo
echo -e "${MAGENTA}${BOLD}"
echo '    ╔══════════════════════════════════════╗'
echo '    ║            R A L P H                 ║'
echo '    ║      autonomous task runner          ║'
echo '    ╚══════════════════════════════════════╝'
echo -e "${RESET}"
echo -e "  ${DIM}Started at $(datestamp)${RESET}"
echo

# ── Resolve agents ────────────────────────────────────────────────
read -r -a AGENTS <<< "$(build_agent_order)" || exit 1
info "Агенты: ${BOLD}${AGENTS[*]}${RESET}${CYAN} (primary: ${AGENTS[0]}, fallback: ${AGENTS[*]:1})"
echo

# ── Task summary before start ────────────────────────────────────
IFS='|' read -r total done_c pending_c other_c <<< "$(get_task_counts)"
echo -e "  ${WHITE}${BOLD}Задачи:${RESET}  ${GREEN}done $done_c${RESET}  ${YELLOW}pending $pending_c${RESET}  ${DIM}other $other_c${RESET}  ${DIM}(total $total)${RESET}"
echo -n "  "
progress_bar "$done_c" "$total"
echo
line

# ── Main loop ─────────────────────────────────────────────────────
iteration=1
tasks_completed=0
USED_AGENT=""

while has_pending_tasks; do
    iter_start=$(date +%s)

    # Get next task info
    task_raw="$(get_next_task_info)"
    CURRENT_TASK_ID=""

    header "ИТЕРАЦИЯ #$iteration"
    echo
    echo -e "  ${DIM}Время:${RESET}      $(datestamp)"
    echo -e "  ${DIM}Общее:${RESET}      $(elapsed_total)"

    # Task counts
    IFS='|' read -r total done_c pending_c other_c <<< "$(get_task_counts)"
    echo -e "  ${DIM}Прогресс:${RESET}   ${GREEN}$done_c${RESET}/${total} done, ${YELLOW}$pending_c pending${RESET}"
    echo -n "  "
    progress_bar "$done_c" "$total"
    echo

    # Print full task card
    if ! print_task_card "$task_raw"; then
        warn "Нет доступных задач (все blocked?). Останавливаюсь."
        break
    fi

    echo
    line

    prompt=$(cat <<'EOF'
@docs/tasks.json @docs/progress.md
1. Прочитай docs/tasks.json и git log --oneline -20.
2. Выбери ОДНУ задачу со статусом pending и наивысшим приоритетом.
   Убедись, что все её dependencies имеют статус done.
3. Работай ТОЛЬКО над этой задачей. Не трогай код, не связанный с ней.
4. Делай коммиты после каждого логического изменения.
5. Выполни ВСЕ test_steps из задачи. Меняй status на done ТОЛЬКО после успешного прохождения.
6. Добавь свой прогресс в файл docs/progress.md.
   Используй это, чтобы оставить заметку для следующей итерации работы над кодом.
7. ЗАПРЕЩЕНО удалять или редактировать задачи — только менять status.
РАБОТАЙ ТОЛЬКО НАД ОДНОЙ ЗАДАЧЕЙ.
Если задача полностью выполнена, выведи <promise>COMPLETE</promise>.
EOF
)

    USED_AGENT=""
    result=$(run_agent_with_fallback "$prompt" "${AGENTS[@]}") || {
        echo
        iter_end=$(date +%s)
        iter_dur=$(( iter_end - iter_start ))

        header "ОШИБКА"
        fail "Все агенты упали на итерации #$iteration"
        echo -e "  ${DIM}Время итерации:${RESET} $(fmt_duration $iter_dur)"
        echo -e "  ${DIM}Общее время:${RESET}    $(elapsed_total)"
        line
        say -v Milena "Хозяин, все агенты упали. Нужна помощь." 2>/dev/null || true
        exit 1
    }

    echo "$result"

    iter_end=$(date +%s)
    iter_dur=$(( iter_end - iter_start ))

    echo
    line

    if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
        ((tasks_completed++))

        echo
        echo -e "  ${GREEN}${BOLD}ЗАДАЧА ВЫПОЛНЕНА${RESET}"
        [[ -n "$CURRENT_TASK_ID" ]] && echo -e "  ${GREEN}$CURRENT_TASK_ID${RESET}"
        echo -e "  ${DIM}Агент:${RESET}          ${BOLD}${USED_AGENT:-?}${RESET}"
        echo -e "  ${DIM}Начало:${RESET}         $(date -r $iter_start "+%H:%M:%S")"
        echo -e "  ${DIM}Конец:${RESET}          $(timestamp)"
        echo -e "  ${DIM}Длительность:${RESET}   ${BOLD}$(fmt_duration $iter_dur)${RESET}"
        echo -e "  ${DIM}Выполнено за сессию:${RESET} $tasks_completed"
        echo -e "  ${DIM}Общее время:${RESET}    $(elapsed_total)"
        echo

        # Updated progress
        IFS='|' read -r total done_c pending_c other_c <<< "$(get_task_counts)"
        echo -n "  "
        progress_bar "$done_c" "$total"
        echo
        line

        if [[ "$pending_c" -eq 0 ]]; then
            echo
            header "ВСЕ ЗАДАЧИ ВЫПОЛНЕНЫ"
            echo
            success "Итераций: $iteration"
            success "Задач выполнено за сессию: $tasks_completed"
            success "Общее время: $(elapsed_total)"
            echo
            say -v Milena "Хозяин, я всё сделалъ!" 2>/dev/null || true
            exit 0
        fi

        echo -e "  ${YELLOW}Осталось задач: $pending_c${RESET}. Продолжаю..."
        say -v Milena "Задача готова. Продолжаю работу." 2>/dev/null || true
    else
        echo
        echo -e "  ${YELLOW}${BOLD}ИТЕРАЦИЯ ЗАВЕРШЕНА (задача не закрыта)${RESET}"
        echo -e "  ${DIM}Агент:${RESET}          ${BOLD}${USED_AGENT:-?}${RESET}"
        echo -e "  ${DIM}Длительность:${RESET}   $(fmt_duration $iter_dur)"
        echo -e "  ${DIM}Общее время:${RESET}    $(elapsed_total)"
        line
    fi

    ((iteration++))
done

echo
header "ГОТОВО"
echo
success "Все задачи выполнены!"
success "Итераций: $((iteration - 1))"
success "Задач выполнено за сессию: $tasks_completed"
success "Общее время: $(elapsed_total)"
echo
say -v Milena "Хозяин, я сделалъ!" 2>/dev/null || true
