interface RequestOptions {
  method?: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function request(
  app: { handle: (req: Request) => Response | Promise<Response> },
  options: RequestOptions,
): Promise<Response> {
  const { method = "GET", path, body, headers = {} } = options;

  const init: RequestInit = { method, headers: { ...headers } };

  if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] =
      "application/json";
    init.body = JSON.stringify(body);
  }

  return app.handle(new Request(`http://localhost${path}`, init));
}
