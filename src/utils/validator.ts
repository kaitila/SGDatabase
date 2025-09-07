import z from "zod";

export default function validate<Schema extends z.ZodSchema>(
  data: unknown,
  schema: Schema
): z.infer<Schema> {
  return schema.parse(data);
}
