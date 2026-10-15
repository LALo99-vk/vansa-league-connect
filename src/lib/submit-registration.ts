import { createServerFn } from "@tanstack/react-start";
import { isRegistrationClosed, registrationSchema } from "./registration";
import { saveRegistration } from "./registration-store";

export const REGISTRATION_CLOSED = "REGISTRATION_CLOSED";
export const NOT_SAVED = "NOT_SAVED";

/** Validates again on the server, then resolves only once the sheet has confirmed the save. */
export const submitRegistration = createServerFn({ method: "POST" })
  .validator((input: unknown) => registrationSchema.parse(input))
  .handler(async ({ data }) => {
    if (isRegistrationClosed()) throw new Error(REGISTRATION_CLOSED);
    try {
      return await saveRegistration(data);
    } catch (error) {
      // Last line of defence: the full entry goes to the server log, so it can be
      // recovered by hand even if Google was unreachable.
      console.error("[registration] NOT SAVED", JSON.stringify(data), error);
      throw new Error(NOT_SAVED);
    }
  });
