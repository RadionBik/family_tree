import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import FamilyTreeGraph from "./FamilyTreeGraph";
import MemberPanel from "./MemberPanel";
import Islands from "./Islands";
import MemberDialog from "./MemberDialog";
import RelationDialog from "./RelationDialog";
import familyTreeService from "../services/familyTreeService";
import authService from "../services/authService";
import { toChartData, pickRoot } from "../utils/chartData";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";

const FamilyTree = ({
  members,
  loading,
  error,
  selectedMemberId,
  onMemberSelect,
  focusId,
  onFocus,
  onChanged,
}) => {
  const { t } = useTranslation();
  const isAdmin = authService.isAdmin();
  const [dialog, setDialog] = useState(null); // "add" | "edit" | "relation"
  const [actionError, setActionError] = useState(null);

  const { data, marriages } = useMemo(() => toChartData(members), [members]);
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const rootId = members.length ? pickRoot(members).id : null;
  const mainId = focusId || rootId;
  const selected = selectedMemberId ? byId.get(selectedMemberId) : null;

  const afterWrite = async (focus) => {
    setDialog(null);
    setActionError(null);
    await onChanged();
    if (focus !== undefined) onMemberSelect(focus);
  };

  const run = async (action) => {
    try {
      await action();
    } catch (err) {
      setActionError(err.response?.data?.detail || t("edit.errorSave"));
    }
  };

  const deleteMember = () => {
    if (!window.confirm(t("edit.confirmDelete", { name: selected.name })))
      return;
    run(async () => {
      await familyTreeService.deleteMember(selected.id);
      await afterWrite(null);
    });
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
          {t("familyTree.title")}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onFocus(rootId)}
          disabled={!rootId || mainId === rootId}
          sx={{ mr: 1 }}
        >
          {t("tree.showAll")}
        </Button>
        {isAdmin && (
          <Button
            size="small"
            variant="contained"
            onClick={() => setDialog("add")}
          >
            {t("edit.addPerson")}
          </Button>
        )}
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && data.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              height: "75vh",
              minHeight: 500,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <FamilyTreeGraph
              data={data}
              marriages={marriages}
              mainId={mainId}
              selectedId={selectedMemberId}
              onSelect={onMemberSelect}
              onMainChange={(id) => {
                onFocus(id);
                onMemberSelect(id);
              }}
            />
          </Box>
          <Box
            sx={{
              width: { md: 380 },
              flexShrink: 0,
              maxHeight: { md: "75vh" },
              overflow: "auto",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <MemberPanel
              member={selected}
              byId={byId}
              isAdmin={isAdmin}
              error={actionError}
              onSelect={onMemberSelect}
              onCenter={() => onFocus(selected.id)}
              isCentered={selected?.id === mainId}
              onEdit={() => setDialog("edit")}
              onDelete={deleteMember}
              onAddRelation={() => setDialog("relation")}
              onRemoveRelation={(id) =>
                run(async () => {
                  await familyTreeService.removeRelation(id);
                  await afterWrite();
                })
              }
              onAddPerson={() => setDialog("add")}
            />
          </Box>
        </Box>
      )}
      {!loading && !error && data.length === 0 && (
        <Typography sx={{ mt: 2 }}>{t("familyTree.noData")}</Typography>
      )}
      {!loading && !error && (
        <Islands
          members={members}
          focusId={mainId}
          onPick={(id) => {
            onFocus(id);
            onMemberSelect(id);
          }}
        />
      )}

      {(dialog === "add" || dialog === "edit") && (
        <MemberDialog
          open
          member={dialog === "edit" ? selected : null}
          onClose={() => setDialog(null)}
          onSaved={(saved) => afterWrite(saved.id)}
        />
      )}
      {selected && dialog === "relation" && (
        <RelationDialog
          open
          member={selected}
          members={members}
          onClose={() => setDialog(null)}
          onSaved={() => afterWrite()}
        />
      )}
    </Paper>
  );
};

export default FamilyTree;
