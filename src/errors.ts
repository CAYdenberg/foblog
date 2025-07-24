export const getErrorMessage = (error: Error | unknown) => {
  return (error instanceof Error) ? error.message : "Unknown error";
};

export class HttpError extends Error {
  public status: number;
  public isHttpError: true;

  constructor(status: number, message?: string) {
    super(message);
    this.status = status;
    this.isHttpError = true;
  }

  public toHttp() {
    return new Response(
      JSON.stringify({
        message: this.message,
      }),
      {
        status: this.status,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
