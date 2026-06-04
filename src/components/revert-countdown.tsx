import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Props {
  deadline: number | null
  onKeep: () => void
  onRevert: () => void
}

/** Modal shown after applying a layout: keep the change, or it auto-reverts
 * when the countdown reaches zero (the Rust timer does the actual revert). */
export function RevertCountdown({ deadline, onKeep, onRevert }: Props) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (deadline == null) return
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [deadline])

  return (
    <Dialog open={deadline != null}>
      <DialogContent
        className="max-w-sm"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Keep these display settings?</DialogTitle>
          <DialogDescription>
            Reverting to the previous layout in{" "}
            <span className="font-semibold text-foreground">{remaining}s</span>{" "}
            if you don't confirm.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onRevert}>
            Revert now
          </Button>
          <Button onClick={onKeep}>Keep changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
