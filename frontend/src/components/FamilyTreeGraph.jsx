import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import f3 from "family-chart";
import "family-chart/styles/family-chart.css";

// `data` is family-chart input (see toChartData in FamilyTree.jsx). The chart
// is person-centric: `mainId` is the card in the middle, clicking a card makes
// it main and reports it through onMainChange.
const FamilyTreeGraph = ({
  data,
  marriages,
  mainId,
  selectedId,
  onSelect,
  onMainChange,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const onMainChangeRef = useRef(onMainChange);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onMainChangeRef.current = onMainChange;
    onSelectRef.current = onSelect;
  }, [onMainChange, onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!data.length || !container) return undefined;
    const chart = f3
      .createChart(container, data)
      .setTransitionTime(400)
      .setCardXSpacing(230)
      .setCardYSpacing(130)
      .setShowSiblingsOfMain(true)
      .setSingleParentEmptyCard(false)
      .setLinkSpouseText(
        (a, b) => marriages.get([a.data.id, b.data.id].sort().join("|")) || "",
      );
    chart.setPersonDropdown((d) => d.data.name, {
      placeholder: t("familyTree.searchPlaceholder", "Search"),
      onSelect: (id) => onMainChangeRef.current?.(id),
    });

    const card = chart
      .setCardHtml()
      .setCardImageField("photo_url")
      .setCardDisplay([(d) => d.data.name, (d) => d.data.years])
      .setOnHoverPathToMain();
    // Click opens the panel; the tree stays as it is.
    card.setOnCardClick((e, d) => onSelectRef.current?.(d.data.id));

    if (mainId && chart.store.getDatum(mainId)) chart.updateMainId(mainId);
    chart.updateTree({ initial: true, tree_position: "fit" });
    chartRef.current = chart;

    return () => {
      chartRef.current = null;
      container.replaceChildren();
    };
    // mainId is applied by the effect below; only data rebuilds the chart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, marriages, t]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !mainId || chart.store.getMainId() === mainId) return;
    if (!chart.store.getDatum(mainId)) return;
    chart.updateMainId(mainId);
    chart.updateTree({ tree_position: "fit" });
  }, [mainId]);

  // A person selected elsewhere (birthday list, relation chip) who is not in the
  // drawn tree becomes the focus so they can be seen.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !selectedId || !chart.store.getDatum(selectedId)) return;
    if (!chart.store.getTreeDatum(selectedId))
      onMainChangeRef.current?.(selectedId);
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
      className="f3"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "rgb(33, 33, 33)",
      }}
    />
  );
};

export default FamilyTreeGraph;
