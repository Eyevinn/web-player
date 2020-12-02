export function isSafari() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return (
    (/safari/.test(userAgent) || /iphone|ipad|ipod/.test(userAgent)) &&
    /apple computer/.test(window.navigator.vendor.toLowerCase())
  );
}
