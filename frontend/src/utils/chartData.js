import { lifeYears } from "./age";

const GENDER = { MALE: "M", FEMALE: "F" };

// API members -> family-chart data. Parents come from PARENT relations,
// spouses from SPOUSE in either direction, children are the inverse of parents.
// Also returns marriage years keyed by the sorted spouse pair.
export const toChartData = (members) => {
  const byId = new Map(
    members.map((m) => [
      m.id,
      {
        id: m.id,
        data: {
          gender: GENDER[m.gender] || "M",
          name: m.name,
          years: lifeYears(m.birth_date, m.death_date),
          photo_url: m.photo_url || "",
        },
        rels: { parents: new Set(), spouses: new Set(), children: new Set() },
      },
    ]),
  );
  const marriages = new Map();
  members.forEach((m) =>
    m.relationships_from.forEach((r) => {
      const from = byId.get(m.id);
      const to = byId.get(r.to_member_id);
      if (!to) return;
      if (r.relation_type === "PARENT") {
        to.rels.parents.add(from.id);
        from.rels.children.add(to.id);
      } else if (r.relation_type === "SPOUSE") {
        from.rels.spouses.add(to.id);
        to.rels.spouses.add(from.id);
        if (r.start_date) {
          marriages.set(
            [from.id, to.id].sort().join("|"),
            r.start_date.slice(0, 4),
          );
        }
      }
    }),
  );
  const data = [...byId.values()].map((d) => ({
    ...d,
    rels: Object.fromEntries(
      Object.entries(d.rels).map(([k, v]) => [k, [...v]]),
    ),
  }));
  return { data, marriages };
};

// Oldest person with a known birth date, else the first one.
export const pickRoot = (members) =>
  [...members]
    .filter((m) => m.birth_date)
    .sort((a, b) => a.birth_date.localeCompare(b.birth_date))[0] || members[0];
