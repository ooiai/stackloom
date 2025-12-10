"use client";
import "@stackloom/ui/globals.css";
import Error from "@stackloom/ui/loomui/error";

export default function NotFound() {
  return (
    <Error
      src="/svg/404.svg"
      alt="404"
      title="页面被外星人劫持了 👽"
      description="页面可能被外星人绑架了 👽，我们已经报警"
      buttonText="紧急逃生到首页"
      herf="/"
    />
  );
}
