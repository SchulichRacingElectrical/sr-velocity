// Copyright Schulich Racing FSAE
// Written by Justin Tijunelis

import React, { useState, useEffect, useContext } from "react";
import { IconButton, ToolTip } from "components/interface";
import { ChartBox, ChartType } from "components/charts/";
import { DashboardContext } from "../../dashboard";
import { SaveOutlined, Add, Air, Category } from "@mui/icons-material";
import DashNav from "components/navigation/dashNav";
import "./_styling/chartView.css";

interface ChartViewProps {}

const ChartView: React.FC<ChartViewProps> = (props: ChartViewProps) => {
  const [charts, setCharts] = useState<any[]>([]);
  const context = useContext(DashboardContext);

  useEffect(() => {
    generateCharts();
  }, []);

  const generateCharts = () => {
    let chartUI = [];
    chartUI.push(
      <ChartBox
        title={"This is a custom chart title"}
        type={ChartType.LINE}
        realtime
      />
    );
    chartUI.push(<ChartBox title={"Title"} type={ChartType.LINE} realtime />);
    setCharts(chartUI);
  };

  return (
    <div>
      <DashNav margin={context.margin}>
        <div className="left">
          <ToolTip value="New Chart">
            <IconButton img={<Add />} />
          </ToolTip>
          <ToolTip value="Presets">
            <IconButton img={<Category />} />
          </ToolTip>
          <ToolTip value="Save Configuration">
            <IconButton img={<SaveOutlined />} />
          </ToolTip>
        </div>
        <div className="right">
          <ToolTip value="Run a Test">
            <IconButton img={<Air />} />
          </ToolTip>
        </div>
      </DashNav>
      <div id="chart-view">{charts}</div>
    </div>
  );
};

export default ChartView;
