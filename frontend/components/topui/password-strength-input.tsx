/** eslint-disable react/display-name */
"use client"

import { Button } from "@/components/ui/button"
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react"
import { forwardRef, useId, useMemo, useState } from "react"
import { Input } from "../ui/input"

// eslint-disable-next-line react/display-name, @typescript-eslint/no-explicit-any
const PasswordStrengthInput = forwardRef<HTMLInputElement, any>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ className, ...props }, ref) => {
    const id = useId()
    const [isVisible, setIsVisible] = useState<boolean>(false)

    const toggleVisibility = () => setIsVisible((prevState) => !prevState)

    const checkStrength = (pass: string) => {
      const requirements = [
        { regex: /.{8,}/, text: "至少8个字符" },
        { regex: /[0-9]/, text: "至少1个数字" },
        { regex: /[a-z]/, text: "至少1个小写字母" },
        { regex: /[A-Z]/, text: "至少1个大写字母" },
      ]

      return requirements.map((req) => ({
        met: req.regex.test(pass),
        text: req.text,
      }))
    }

    const strength = checkStrength(props.value || "")

    const strengthScore = useMemo(() => {
      return strength.filter((req) => req.met).length
    }, [strength])

    const getStrengthColor = (score: number) => {
      if (score === 0) return "bg-border"
      if (score <= 1) return "bg-red-500"
      if (score <= 2) return "bg-orange-500"
      if (score === 3) return "bg-amber-500"
      return "bg-emerald-500"
    }

    const getStrengthText = (score: number) => {
      if (score === 0) return "输入密码"
      if (score <= 2) return "弱密码"
      if (score === 3) return "中等密码"
      return "强密码"
    }

    return (
      <div>
        {/* Password input field with toggle visibility button */}
        <div className="*:not-first:mt-2">
          <div className="relative">
            <Input
              id={id}
              className="pe-9"
              placeholder="Password"
              type={isVisible ? "text" : "password"}
              // value={password}
              aria-describedby={`${id}-description`}
              ref={ref}
              {...props}
              // onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute inset-y-0 inset-e-0 h-full w-9 rounded-e-md rounded-s-none px-0 text-muted-foreground/80 hover:bg-transparent hover:text-foreground focus:z-10"
              type="button"
              onClick={toggleVisibility}
              aria-label={isVisible ? "Hide password" : "Show password"}
              aria-pressed={isVisible}
              aria-controls="password"
            >
              {isVisible ? (
                <EyeOffIcon size={16} aria-hidden="true" />
              ) : (
                <EyeIcon size={16} aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {/* Password strength indicator */}
        {props.value && (
          <div
            className="mt-3 mb-4 h-1 w-full overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={strengthScore}
            aria-valuemin={0}
            aria-valuemax={4}
            aria-label="Password strength"
            hidden={props.disabled}
          >
            <div
              className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
              style={{ width: `${(strengthScore / 4) * 100}%` }}
            ></div>
          </div>
        )}

        {/* Password strength description */}
        {props.value && (
          <p
            id={`${id}-description`}
            className="mb-2 text-sm font-medium text-foreground"
            hidden={props.disabled}
          >
            {getStrengthText(strengthScore)}. 必须包含:
          </p>
        )}

        {/* Password requirements list */}
        {props.value && (
          <ul
            className="space-y-1.5"
            aria-label="Password requirements"
            hidden={props.disabled}
          >
            {strength.map((req, index) => (
              <li key={index} className="flex items-center gap-2">
                {req.met ? (
                  <CheckIcon
                    size={16}
                    className="text-emerald-500"
                    aria-hidden="true"
                  />
                ) : (
                  <XIcon
                    size={16}
                    className="text-muted-foreground/80"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`text-xs ${req.met ? "text-emerald-600" : "text-muted-foreground"}`}
                >
                  {req.text}
                  <span className="sr-only">
                    {req.met ? " - Requirement met" : " - Requirement not met"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
)

export default PasswordStrengthInput
