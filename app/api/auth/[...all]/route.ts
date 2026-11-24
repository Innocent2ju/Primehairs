import { auth } from "@/lib/auth";

const handler = auth.handler();

type RouteContext = { params: Promise<{ all: string[] }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { all } = await params;
  return handler.GET(request, { params: Promise.resolve({ path: all }) });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { all } = await params;
  return handler.POST(request, { params: Promise.resolve({ path: all }) });
}
