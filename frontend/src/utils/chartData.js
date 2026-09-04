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

// Default focus: the person without parents who has the most descendants, so the
// opening view shows as much of the family as possible. Ties go to the oldest.
export const pickRoot = (members) => {
  const children = new Map(members.map((m) => [m.id, []]));
  const hasParent = new Set();
  members.forEach((m) =>
    m.relationships_from.forEach((r) => {
      if (r.relation_type !== "PARENT" || !children.has(r.to_member_id)) return;
      children.get(m.id).push(r.to_member_id);
      hasParent.add(r.to_member_id);
    }),
  );
  const descendants = (id) => {
    const seen = new Set();
    const queue = [id];
    while (queue.length) {
      children.get(queue.pop()).forEach((c) => {
        if (!seen.has(c)) {
          seen.add(c);
          queue.push(c);
        }
      });
    }
    return seen.size;
  };
  return (
    [...members]
      .filter((m) => !hasParent.has(m.id))
      .map((m) => [m, descendants(m.id)])
      .sort(
        (x, y) =>
          y[1] - x[1] ||
          (x[0].birth_date || "9999").localeCompare(y[0].birth_date || "9999"),
      )[0]?.[0] ?? members[0]
  );
};

// Connected groups of people (parent and spouse links, any direction), largest first.
export const components = (members) => {
  const adj = new Map(members.map((m) => [m.id, new Set()]));
  members.forEach((m) =>
    m.relationships_from.forEach((r) => {
      if (!adj.has(r.to_member_id)) return;
      adj.get(m.id).add(r.to_member_id);
      adj.get(r.to_member_id).add(m.id);
    }),
  );
  const seen = new Set();
  const groups = [];
  members.forEach((start) => {
    if (seen.has(start.id)) return;
    const group = [];
    const queue = [start.id];
    seen.add(start.id);
    while (queue.length) {
      const id = queue.pop();
      group.push(id);
      adj.get(id).forEach((n) => {
        if (!seen.has(n)) {
          seen.add(n);
          queue.push(n);
        }
      });
    }
    groups.push(group);
  });
  const byId = new Map(members.map((m) => [m.id, m]));
  return groups
    .map((g) => g.map((id) => byId.get(id)))
    .sort((a, b) => b.length - a.length);
};
