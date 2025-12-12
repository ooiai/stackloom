import { Button } from "../components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";

export function Tooltips({
  children,
  content,
  delayDuration = 300,
}: {
  children?: React.ReactNode;
  content?: React.ReactNode;
  delayDuration?: number;
}) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>
        {children ? children : <Button>Tooltip</Button>}
      </TooltipTrigger>
      <TooltipContent>
        {content ? content : "This is tooltip content"}
      </TooltipContent>
    </Tooltip>
  );
}
