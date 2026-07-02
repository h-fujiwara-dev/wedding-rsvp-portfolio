"use client";

import { cloneElement, useMemo, useState, type ReactElement, type HTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Home,
  UtensilsCrossed,
  MessageSquare,
  Users,
  Cake,
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
} from "lucide-react";
import { createRsvpSchema, type RsvpFormValues } from "@/lib/schema";
import { useLang } from "@/context/LangContext";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BorderBeam } from "@/components/ui/border-beam";

type SubmitState = "idle" | "submitting" | "success-animating" | "success" | "error";

function FieldRow({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="relative"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon
          className="transition-colors duration-200"
          style={{
            width: 11,
            height: 11,
            color: focused ? "#2C2B1E" : "#8C8A78",
          }}
          aria-hidden
        />
        {children}
      </div>
    </div>
  );
}

function FocusField({
  children,
  ...controlProps
}: { children: ReactElement } & HTMLAttributes<HTMLElement>) {
  const [focused, setFocused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  return (
    <div
      className="relative"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {cloneElement(children, controlProps)}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] bg-wedding-charcoal pointer-events-none"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
        style={{ originX: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}

function SubmitButton({
  state,
  submitLabel,
  submittingLabel,
}: {
  state: SubmitState;
  submitLabel: string;
  submittingLabel: string;
}) {
  const isCircle = state === "submitting" || state === "success-animating";
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.button
      layout
      type="submit"
      disabled={state === "submitting" || state === "success-animating"}
      data-testid="rsvp-submit"
      className="relative overflow-hidden font-sans text-[11px] tracking-[0.35em] uppercase text-wedding-cream bg-wedding-charcoal border border-white/[0.06] disabled:cursor-not-allowed"
      animate={
        isCircle
          ? { width: 52, height: 52, borderRadius: "50%", paddingLeft: 0, paddingRight: 0 }
          : { width: "auto", height: 52, borderRadius: 999, paddingLeft: 64, paddingRight: 64 }
      }
      transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.76, 0, 0.24, 1] }}
      whileHover={!isCircle ? { backgroundColor: "#3F4A35", scale: 1.02 } : {}}
      whileTap={!isCircle ? { scale: 0.98 } : {}}
    >
      {!isCircle && (
        <span
          className="absolute inset-0 -translate-x-full opacity-[0.10] [background:linear-gradient(90deg,transparent,#C4B47E,transparent)] group-hover:[animation:shimmer-sweep_2.2s_ease-in-out_infinite] pointer-events-none"
          aria-hidden
        />
      )}

      <AnimatePresence mode="wait">
        {(state === "idle" || state === "error") && (
          <motion.span
            key="label"
            className="relative z-10 whitespace-nowrap inline-flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18 }}
          >
            <CalendarCheck className="w-3 h-3" aria-hidden />
            {submitLabel}
          </motion.span>
        )}

        {state === "submitting" && (
          <motion.div
            key="spinner"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
          >
            <span className="sr-only">{submittingLabel}</span>
            <motion.div
              className="w-[18px] h-[18px] rounded-full border-2 border-wedding-cream/20 border-t-wedding-cream"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}

        {state === "success-animating" && (
          <motion.div
            key="check"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.25, ease: "backOut" }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke="#F2EDE3"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M4 12.5 L9.5 18 L20 7"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.55, delay: reducedMotion ? 0 : 0.1, ease: "easeOut" }}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function RsvpForm() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { t, locale } = useLang();
  const reducedMotion = usePrefersReducedMotion();

  // Rebuild the schema whenever the locale changes so validation messages stay translated
  const schema = useMemo(() => createRsvpSchema(t), [locale]);

  const form = useForm<RsvpFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      attend_or_absent: undefined,
      number_of_participants: undefined,
      name: "",
      email_address: "",
      age: undefined,
      postcode: "",
      address: "",
      phone_number: "",
      dietary_restrictions: "",
      message: "",
    },
  });

  async function onSubmit(values: RsvpFormValues) {
    setSubmitState("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });

      if (res.status === 201) {
        setSubmitState("success-animating");
        setTimeout(() => setSubmitState("success"), 1500);
        return;
      }

      const json = await res.json().catch(() => ({}));
      const msg = json.error ?? t("form.err.generic");

      if (res.status >= 500) {
        Sentry.captureException(new Error(`[RSVP] API ${res.status}: ${msg}`), {
          extra: { status: res.status },
        });
      }

      setErrorMessage(msg);
      setSubmitState("error");
    } catch (err) {
      Sentry.captureException(err, { tags: { context: "rsvp_form_submit" } });
      setErrorMessage(t("form.err.network"));
      setSubmitState("error");
    }
  }

  if (submitState === "success") {
    return (
      <motion.div
        role="status"
        aria-live="polite"
        className="py-20 text-center"
        data-testid="rsvp-success"
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.6, ease: [0.76, 0, 0.24, 1] }}
      >
        <motion.div
          initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : 0.1, ease: "backOut" }}
          className="flex justify-center mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-wedding-forest" strokeWidth={1.5} />
        </motion.div>
        <p className="font-display text-5xl text-wedding-charcoal mb-4">{t("form.successTitle")}</p>
        <p className="font-serif text-wedding-taupe-dark leading-relaxed whitespace-pre-line">
          {t("form.successMsg")}
        </p>
      </motion.div>
    );
  }

  return (
    <Form {...form}>
      <div className="relative rounded-2xl">
        <BorderBeam size={180} duration={12} colorFrom="#C4B47E" colorTo="transparent" borderWidth={1} />

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-7 text-left p-8 md:p-10"
          data-testid="rsvp-form"
          noValidate
        >
          {/* ── Attendance */}
          <FormField
            control={form.control}
            name="attend_or_absent"
            render={({ field }) => (
              <FormItem>
                <FieldRow icon={CalendarCheck}>
                  <FormLabel className="font-sans text-[11px] tracking-[0.3em] uppercase text-wedding-taupe-dark">
                    {t("form.attendOrAbsentLabel")} <span className="text-destructive">*</span>
                  </FormLabel>
                </FieldRow>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    className="flex gap-8 mt-2"
                    data-testid="attend-radio"
                  >
                    <div className="relative flex items-center gap-2">
                      <RadioGroupItem value="attend" id="attend" />
                      <Label htmlFor="attend" className="font-serif cursor-pointer">
                        {t("form.attend")}
                      </Label>
                    </div>
                    <div className="relative flex items-center gap-2">
                      <RadioGroupItem value="absent" id="absent" />
                      <Label htmlFor="absent" className="font-serif cursor-pointer">
                        {t("form.absent")}
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Number of participants */}
          <FormField
            control={form.control}
            name="number_of_participants"
            render={({ field }) => (
              <FormItem>
                <FieldRow icon={Users}>
                  <FormLabel className="font-sans text-[11px] tracking-[0.3em] uppercase text-wedding-taupe-dark">
                    {t("form.participantsLabel")} <span className="text-destructive">*</span>
                  </FormLabel>
                </FieldRow>
                <FormControl>
                  <FocusField>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      placeholder={t("form.participantsPlaceholder")}
                      data-testid="number-of-participants"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                    />
                  </FocusField>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Full name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FieldRow icon={User}>
                  <FormLabel className="font-sans text-[11px] tracking-[0.3em] uppercase text-wedding-taupe-dark">
                    {t("form.nameLabel")} <span className="text-destructive">*</span>
                  </FormLabel>
                </FieldRow>
                <FormControl>
                  <FocusField>
                    <Input
                      placeholder={t("form.namePlaceholder")}
                      data-testid="name"
                      autoComplete="name"
                      {...field}
                    />
                  </FocusField>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Email */}
          <FormField
            control={form.control}
            name="email_address"
            render={({ field }) => (
              <FormItem>
                <FieldRow icon={Mail}>
                  <FormLabel className="font-sans text-[11px] tracking-[0.3em] uppercase text-wedding-taupe-dark">
                    {t("form.emailLabel")} <span className="text-destructive">*</span>
                  </FormLabel>
                </FieldRow>
                <FormControl>
                  <FocusField>
                    <Input
                      type="email"
                      placeholder={t("form.emailPlaceholder")}
                      data-testid="email-address"
                      autoComplete="email"
                      {...field}
                    />
                  </FocusField>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Age */}
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FieldRow icon={Cake}>
                  <FormLabel className="font-sans text-[11px] tracking-[0.3em] uppercase text-wedding-taupe-dark">
                    {t("form.ageLabel")}
                  </FormLabel>
                </FieldRow>
                <FormControl>
                  <FocusField>
                    <Input
                      type="number"
                      min={0}
                      max={120}
                      placeholder={t("form.agePlaceholder")}
                      data-testid="age"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                    />
                  </FocusField>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Postcode */}
          <FormField
            control={form.control}
            name="postcode"
            render={({ field }) => (
              <FormItem>
                <FieldRow icon={MapPin}>
                  <FormLabel className="font-sans text-[11px] tracking-[0.3em] uppercase text-wedding-taupe-dark">
                    {t("form.postcodeLabel")}
                  </FormLabel>
                </FieldRow>
                <FormControl>
                  <FocusField>
                    <Input
                      placeholder={t("form.postcodePlaceholder")}
                      data-testid="postcode"
                      autoComplete="postal-code"
                      {...field}
                    />
                  </FocusField>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FieldRow icon={Home}>
                  <FormLabel className="font-sans text-[11px] tracking-[0.3em] uppercase text-wedding-taupe-dark">
                    {t("form.addressLabel")}
                  </FormLabel>
                </FieldRow>
                <FormControl>
                  <FocusField>
                    <Textarea
                      placeholder={t("form.addressPlaceholder")}
                      rows={2}
                      data-testid="address"
                      autoComplete="street-address"
                      {...field}
                    />
                  </FocusField>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Phone */}
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FieldRow icon={Phone}>
                  <FormLabel className="font-sans text-[11px] tracking-[0.3em] uppercase text-wedding-taupe-dark">
                    {t("form.phoneLabel")}
                  </FormLabel>
                </FieldRow>
                <FormControl>
                  <FocusField>
                    <Input
                      type="tel"
                      placeholder={t("form.phonePlaceholder")}
                      data-testid="phone-number"
                      autoComplete="tel"
                      {...field}
                    />
                  </FocusField>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Dietary restrictions */}
          <FormField
            control={form.control}
            name="dietary_restrictions"
            render={({ field }) => (
              <FormItem>
                <FieldRow icon={UtensilsCrossed}>
                  <FormLabel className="font-sans text-[11px] tracking-[0.3em] uppercase text-wedding-taupe-dark">
                    {t("form.dietaryLabel")}
                  </FormLabel>
                </FieldRow>
                <FormControl>
                  <FocusField>
                    <Textarea
                      placeholder={t("form.dietaryPlaceholder")}
                      rows={3}
                      data-testid="dietary-restrictions"
                      {...field}
                    />
                  </FocusField>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Message */}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FieldRow icon={MessageSquare}>
                  <FormLabel className="font-sans text-[11px] tracking-[0.3em] uppercase text-wedding-taupe-dark">
                    {t("form.messageLabel")}
                  </FormLabel>
                </FieldRow>
                <FormControl>
                  <FocusField>
                    <Textarea
                      placeholder={t("form.messagePlaceholder")}
                      rows={4}
                      data-testid="message"
                      {...field}
                    />
                  </FocusField>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Error display */}
          <AnimatePresence>
            {submitState === "error" && (
              <motion.div
                role="alert"
                className="flex items-center gap-2 text-sm text-destructive"
                data-testid="rsvp-error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden />
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Submit button */}
          <div className="text-center pt-4">
            <SubmitButton
              state={submitState}
              submitLabel={t("form.submitLabel")}
              submittingLabel={t("form.submittingLabel")}
            />
          </div>
        </form>
      </div>
    </Form>
  );
}
