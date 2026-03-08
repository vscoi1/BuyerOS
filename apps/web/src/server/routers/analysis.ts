import { protectedProcedure, router } from "@/lib/trpc/server";
import { estimateStampDuty } from "@/server/services/australian-taxes";
import { analysisStampDutyInput } from "@/server/validators";

export const analysisRouter = router({
  stampDutyEstimate: protectedProcedure.input(analysisStampDutyInput).query(({ input }) => {
    return estimateStampDuty(input);
  }),
});

