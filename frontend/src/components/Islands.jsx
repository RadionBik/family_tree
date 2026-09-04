import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { components } from "../utils/chartData";

// Groups of people not linked to the group currently drawn: where relations are
// still missing. Clicking a name focuses the tree on that group.
const Islands = ({ members, focusId, onPick }) => {
  const { t } = useTranslation();
  const groups = useMemo(() => components(members), [members]);
  const others = groups.filter((g) => !g.some((m) => m.id === focusId));
  if (others.length === 0) return null;
  const singles = others.filter((g) => g.length === 1).flat();
  const multi = others.filter((g) => g.length > 1);
  const people = others.reduce((n, g) => n + g.length, 0);

  const chips = (list) => (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
      {list.map((m) => (
        <Chip
          key={m.id}
          label={m.name}
          size="small"
          onClick={() => onPick(m.id)}
        />
      ))}
    </Stack>
  );

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1">
        {t("islands.title", { groups: others.length, people })}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {t("islands.hint")}
      </Typography>
      {multi.map((g) => (
        <Box key={g[0].id} sx={{ mb: 1 }}>
          {chips(g)}
        </Box>
      ))}
      {singles.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t("islands.singles", { count: singles.length })}
          </Typography>
          {chips(singles)}
        </Box>
      )}
    </Box>
  );
};

export default Islands;
