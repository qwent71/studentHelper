#!/bin/bash
set -e

TASKS_FILE="docs/tasks.json"

# Agent selection:
# - Set RALPH_AGENT=claude or RALPH_AGENT=codex to force.
# - Otherwise auto-detect (prefers Claude if available).
resolve_agent() {
    if [[ -n "${RALPH_AGENT:-}" ]]; then
        echo "$RALPH_AGENT"
        return 0
    fi
    if command -v claude >/dev/null 2>&1; then
        echo "claude"
        return 0
    fi
    if command -v codex >/dev/null 2>&1; then
        echo "codex"
        return 0
    fi
    return 1
}

run_agent() {
    local agent="$1"
    local prompt="$2"

    case "$agent" in
        claude)
            claude --dangerously-skip-permissions -p "$prompt"
            ;;
        codex)
            local output_file
            output_file="$(mktemp -t ralph_codex.XXXXXX)"
            # Use non-interactive Codex exec and capture only the last message.
            codex exec --full-auto --color never -C "$PWD" --output-last-message "$output_file" "$prompt" >/dev/null
            cat "$output_file"
            rm -f "$output_file"
            ;;
        *)
            echo "Unsupported agent: $agent" >&2
            return 1
            ;;
    esac
}

# Функция проверки наличия pending задач
has_pending_tasks() {
    local pending_count
    pending_count=$(grep -c '"status": "pending"' "$TASKS_FILE" 2>/dev/null) || pending_count=0
    [ "$pending_count" -gt 0 ]
}

iteration=1

while has_pending_tasks; do
    echo "Итерация $iteration"
    echo "-----------------------------------"

    # Показываем текущий статус задач
    pending=$(grep -c '"status": "pending"' "$TASKS_FILE" 2>/dev/null) || pending=0
    done_count=$(grep -c '"status": "done"' "$TASKS_FILE" 2>/dev/null) || done_count=0
    echo "Задач pending: $pending, done: $done_count"
    echo "-----------------------------------"

    agent=$(resolve_agent) || {
        echo "Не найден поддерживаемый агент. Установите 'claude' или 'codex', либо задайте RALPH_AGENT." >&2
        exit 1
    }

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

    result=$(run_agent "$agent" "$prompt")

    echo "$result"

    if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
        echo "✓ TASK выполнен!"
        # Проверяем, остались ли ещё pending задачи
        remaining=$(grep -c '"status": "pending"' "$TASKS_FILE" 2>/dev/null) || remaining=0
        if [ "$remaining" -eq 0 ]; then
            echo "🎉 Все задачи выполнены!"
            say -v Milena "Хозяин, я всё сделалъ!"
            exit 0
        fi
        echo "Осталось задач: $remaining. Продолжаю..."
        say -v Milena "Задача готова. Продолжаю работу."
    fi

    ((iteration++))
done

echo "Все задачи выполнены! Итераций: $((iteration-1))"
say -v Milena "Хозяин, я сделалъ!"
