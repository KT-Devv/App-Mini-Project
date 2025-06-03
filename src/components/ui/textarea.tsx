import * as React from "react";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`rounded-lg border p-2 ${className}`}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";

export default Textarea;
