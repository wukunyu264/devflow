type AuthFailure = { code?: string; status?: number };

// Never return the provider's raw message: it may reveal account existence or PII.
export function authFailure(action: "login" | "register", error: AuthFailure) {
  if (error.code === "over_email_send_rate_limit")
    return { status: 429, code: "AUTH_EMAIL_LIMIT", message: "验证邮件发送额度已用尽，请稍后再试或联系站长；已有账号可直接登录。" };
  if (error.code === "email_address_not_authorized")
    return { status: 503, code: "AUTH_EMAIL_UNAVAILABLE", message: "站点暂时无法向此邮箱发送验证邮件，请联系站长配置邮件服务；已有账号可直接登录。" };
  if (error.status === 429 || ["over_request_rate_limit", "over_email_send_rate_limit"].includes(error.code ?? ""))
    return { status: 429, code: "AUTH_RATE_LIMIT", message: "认证请求过于频繁，请稍后再试。" };
  if (error.code === "signup_disabled")
    return { status: 503, code: "AUTH_SIGNUP_DISABLED", message: "站点暂未开放注册，请联系站长。" };
  if (error.code === "weak_password")
    return { status: 400, code: "AUTH_WEAK_PASSWORD", message: "密码强度不足，请使用更长且不常见的密码。" };
  if (error.code === "email_address_invalid")
    return { status: 400, code: "AUTH_EMAIL_INVALID", message: "请输入有效的邮箱地址。" };
  if (!error.status || error.status >= 500)
    return { status: 503, code: "AUTH_UNAVAILABLE", message: "认证服务暂时不可用，请稍后重试或联系站长。" };
  return action === "login"
    ? { status: 401, code: "AUTH_CREDENTIALS", message: "邮箱或密码错误，或邮箱尚未验证。" }
    : { status: 400, code: "AUTH_REGISTER", message: "注册申请无法完成，请检查填写内容，或尝试登录；需要帮助请联系站长。" };
}
