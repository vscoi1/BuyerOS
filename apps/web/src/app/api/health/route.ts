export async function GET() {
  return Response.json({
    status: "ok",
    service: "buyersos-web",
    timestamp: new Date().toISOString(),
  });
}
