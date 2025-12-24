import { useState, FormEvent, useEffect, useRef } from "react";
import { logger } from "../../services/logger";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Loader2, MessageSquarePlus, Paperclip, X } from "lucide-react";

export type TicketComposerValues = {
  subject: string;
  type: string;
  priority: "low" | "normal" | "high" | "urgent";
  message: string;
};

export function TicketComposer({
  onSubmit,
  defaultType = "general",
  submitting = false,
  onCancel,
  className,
}: {
  onSubmit?: (
    values: TicketComposerValues,
    files?: File[]
  ) => Promise<void> | void;
  defaultType?: string;
  submitting?: boolean;
  onCancel?: () => void;
  className?: string;
}) {
  const [values, setValues] = useState<TicketComposerValues>(() => {
    // Load draft from localStorage if present
    try {
      const raw = localStorage.getItem("ticket-composer-draft");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TicketComposerValues>;
        return {
          subject: parsed.subject || "",
          type: parsed.type || defaultType,
          priority: parsed.priority || "normal",
          message: parsed.message || "",
        };
      }
    } catch {
      /* ignore */
    }
    return {
      subject: "",
      type: defaultType,
      priority: "normal",
      message: "",
    };
  });
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!values.subject.trim() || !values.message.trim()) {
      setError("Please provide a subject and message.");
      return;
    }

    try {
      await onSubmit?.(values, files);

      setSuccess(true);
      setValues({
        subject: "",
        type: defaultType,
        priority: "normal",
        message: "",
      });
      setFiles([]);
      localStorage.removeItem("ticket-composer-draft");
    } catch (err) {
      logger.error("TicketComposer submit error", { error: err });
      setError(err instanceof Error ? err.message : "Failed to submit ticket");
    }
  };

  // Persist draft whenever values change (simple immediate save)
  useEffect(() => {
    try {
      localStorage.setItem("ticket-composer-draft", JSON.stringify(values));
    } catch {
      /* ignore */
    }
  }, [values]);

  return (
    <Card
      className={`bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden ${
        className || ""
      }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <MessageSquarePlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">
                Create Support Ticket
              </h3>
              <p className="text-gray-400 text-sm">
                We'll respond as soon as possible
              </p>
            </div>
          </div>
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Subject - Full Width */}
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm font-medium">
              Subject *
            </Label>
            <Input
              value={values.subject}
              onChange={(e) =>
                setValues({ ...values, subject: e.target.value })
              }
              placeholder="Brief description of your issue"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-11"
              required
            />
          </div>

          {/* Category and Priority - Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm font-medium">
                Category *
              </Label>
              <Select
                value={values.type}
                onValueChange={(v) => setValues({ ...values, type: v })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="technical">Technical Support</SelectItem>
                  <SelectItem value="billing">Billing & Payment</SelectItem>
                  <SelectItem value="order">Order Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm font-medium">
                Priority *
              </Label>
              <Select
                value={values.priority}
                onValueChange={(v) =>
                  setValues({
                    ...values,
                    priority: v as TicketComposerValues["priority"],
                  })
                }
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="low">Low - General question</SelectItem>
                  <SelectItem value="normal">
                    Normal - Standard issue
                  </SelectItem>
                  <SelectItem value="high">High - Important</SelectItem>
                  <SelectItem value="urgent">Urgent - Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Message - Full Width */}
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm font-medium">
              Message *
            </Label>
            <Textarea
              value={values.message}
              onChange={(e) =>
                setValues({ ...values, message: e.target.value })
              }
              placeholder="Please provide as much detail as possible about your issue..."
              rows={6}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
              required
            />
            <p className="text-xs text-gray-500">
              Include any relevant order numbers, error messages, or screenshots
            </p>
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm font-medium">
              Attachments (Optional)
            </Label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  if (newFiles.length) {
                    setFiles((prev) => [...prev, ...newFiles]);
                  }
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-white/20 text-white hover:bg-white/5 hover:border-sky-500/40"
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Attach Files
              </Button>
              <span className="text-xs text-gray-500">
                Max 5 files, 10MB each
              </span>
            </div>

            {/* File Previews */}
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg group hover:border-sky-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Paperclip className="w-4 h-4 text-sky-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setFiles((arr) => arr.filter((_, i) => i !== idx))
                      }
                      className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400">
                ✓ Ticket submitted successfully!
              </p>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <Badge
              variant="outline"
              className="bg-sky-500/10 border-sky-500/40 text-sky-400"
            >
              New Ticket
            </Badge>
            <div className="flex items-center gap-3">
              {onCancel && (
                <Button
                  type="button"
                  onClick={onCancel}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 min-w-[120px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>Submit Ticket</>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
}

export default TicketComposer;
