export const contributionRoleId = "build-contribution-role";
export const contributionCriterion =
  "Zaproś osobę, która osobiście podjęła i wdrożyła decyzję o dopuszczeniu lub wstrzymaniu wersji systemu AI na podstawie wyników ewaluacji i potrafi opisać jej skutek.";

export function contributionReview(params: URLSearchParams) {
  const set = params.get("zestaw");
  const material = params.get("material");
  if ((set !== "a" && set !== "b") || (material !== "cv" && material !== "karta")) return null;
  return { set, showCard: material === "karta", search: `?zestaw=${set}&material=${material}` };
}

export type ContributionReview = NonNullable<ReturnType<typeof contributionReview>>;

export function belongsToReview(applicationId: string, review: ContributionReview) {
  return applicationId.startsWith(`contribution-${review.set}-`);
}
