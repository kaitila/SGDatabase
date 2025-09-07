import z from "zod";

export const nameLinkDataSchema = z.array(
  z.object({
    name: z.coerce.string(),
    link: z.string(),
  })
);

export type NameLinkData = z.infer<typeof nameLinkDataSchema>;
