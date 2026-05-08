import { useState, useCallback, useRef, useEffect } from "react";
import Inventory from "../../nodes/inventory";
import ProductionOrder from "../../nodes/productionOrder";
import Parts from "../../nodes/parts";
import Processing from "../../nodes/processing";
import Assembly from "../../nodes/assembly";
import FinalProduct from "../../nodes/finalProduct";
import { backgroundColor } from "./backgroundTheme/background";
import { color } from "./backgroundTheme/color";
import { Maximize2, Minimize2 } from "lucide-react";
import AutoLayoutButton from "../../nodes/autoLayout";
import {
  ReactFlow,
  Background,
  Controls,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { initialNodes } from "./nodes";
import { initialEdges } from "./edges";
import CustomEdge from "../../nodes/customEdge";

const nodeTypes = {
  inventory: Inventory,
  productionOrder: ProductionOrder,
  parts: Parts,
  processing: Processing,
  assembly: Assembly,
  finalProduct: FinalProduct,
};

const edgeTypes = { "custom-edge": CustomEdge };

export default function Demo() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const [bgColorKey, setBgColorKey] = useState("white");
  const [colorKey, setColorKey] = useState("dark");

  const onNodesChange = useCallback(
    (changes) => setNodes((state) => applyNodeChanges(changes, state)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback((params) => {
    const edge = { ...params, type: "custom-edge" };
    setEdges((eds) => addEdge(edge, eds));
  }, []);

  const fullscreenRef = useRef(null);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const handler = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleFullscreen = () => {
    const el = fullscreenRef.current;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };

  const handleExitFullscreen = () => {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  };

  return (
    <div ref={fullscreenRef} className="w-full h-full min-h-[calc(100vh-200px)] md:min-h-[calc(100vh-180px)] flex flex-col  bg-slate-50">
      <ReactFlow
        onlyRenderVisibleElements={true}
        maxZoom={2}
        minZoom={0.1}
        nodes={nodes}
        nodeTypes={nodeTypes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        edgeTypes={edgeTypes}
      >
        <MiniMap   nodeBorderRadius={50}
  nodeColor={(node) => {
  switch (node.type) {
    case "productionOrder":
      return "#3b82f6";
    case "inventory":
      return "#64748b";
      case "parts":
      return "#6366f1";
      case "processing":
      return "#10b981";
      case "assembly":
      return "#f59e0b";
      case "finalProduct":
        return "#84cc16"
    default:
      return "blue";
  }
}}></MiniMap>
        <Ribbon
          bgColorKey={bgColorKey}
          setBgColorKey={setBgColorKey}
          colorKey={colorKey}
          setColorKey={setColorKey}
         
        />

        <Background
          color={color[colorKey]}
          bgColor={backgroundColor[bgColorKey]}
          size={2}
          
        />

        <Controls className="scale-90">
          {!isFull && (
            <button onClick={handleFullscreen} className="react-flow__controls-button">
              <Maximize2  />
            </button>
          )}
          {isFull && (
            <button onClick={handleExitFullscreen} className="react-flow__controls-button">
              <Minimize2 />
            </button>
          )}
         <AutoLayoutButton/>
          


        </Controls>
      </ReactFlow>
    </div>
  );
}

import ThemeRibbonContent from "./themePopup";
import NodesRibbonContent from "./nodesRibbonContent";

function Ribbon({
  bgColorKey,
  setBgColorKey,
  colorKey,
  setColorKey,
}) {
  const [activeTab, setActiveTab] = useState(null);

  return (
    <div className="sticky top-0 z-20 bg-gray-50 shadow-md">
      <div className="flex items-center gap-4 px-4 h-12 border-b">
        <RibbonTab
          label="Nodes"
          active={activeTab === "nodes"}
          onClick={() =>
            setActiveTab(activeTab === "nodes" ? null : "nodes")
          }
        />

        <RibbonTab
          label="Theme"
          active={activeTab === "theme"}
          onClick={() =>
            setActiveTab(activeTab === "theme" ? null : "theme")
          }
        />
      </div>

      {activeTab && (
        <div className="px-4 py-3 border-b bg-gray-100">
          {activeTab === "nodes" && <NodesRibbonContent />}

          {activeTab === "theme" && (
            <ThemeRibbonContent
              bgColorKey={bgColorKey}
              setBgColorKey={setBgColorKey}
              colorKey={colorKey}
              setColorKey={setColorKey}
            />
          )}
        </div>
      )}
    </div>
  );
}



function RibbonTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-sm font-medium
        ${
          active
            ? "bg-white shadow text-blue-600"
            : "hover:bg-gray-200 text-gray-700"
        }`}
    >
      {label}
    </button>
  );
}
