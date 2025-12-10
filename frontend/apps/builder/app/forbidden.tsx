"use client";
import "@stackloom/ui/globals.css";
import Error from "@stackloom/ui/loomui/error";

export default function Forbidden() {
  return (
    <Error
      src="/svg/403.svg"
      alt="403"
      title="禁止访问 👮"
      description="请检查您的权限或联系管理员。👮"
      buttonText="紧急逃生到首页"
      herf="/"
    />
  );
}
