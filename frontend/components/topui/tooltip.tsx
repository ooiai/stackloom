import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function Tooltips({
  children,
  content,
}: {
  children?: React.ReactNode
  content?: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger>
        {children ? children : <Button>Tooltip</Button>}
      </TooltipTrigger>
      <TooltipContent>
        {content ? content : "This is tooltip content"}
      </TooltipContent>
    </Tooltip>
  )
}
