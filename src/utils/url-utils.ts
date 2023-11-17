export default class UrlUtils {
  public static getAbsoluteUrl(baseUrl: string, relativePath: string): string {
    return (
      (baseUrl[baseUrl.length - 1] === "/"
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl) +
      "/" +
      (relativePath[0] === "/" ? relativePath.substring(1) : relativePath)
    );
  }
}
