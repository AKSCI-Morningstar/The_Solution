export async function slugify(name: string): Promise<string> {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "org"
  );
}

export async function generateUniqueSlug(
  prisma: { organization: { findUnique: (args: { where: { slug: string } }) => unknown } },
  base: string,
): Promise<string> {
  let slug = await slugify(base);
  let attempt = 0;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${await slugify(base)}-${attempt}`;
  }
  return slug;
}
