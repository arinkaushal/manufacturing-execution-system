import { useState, useCallback, useRef, useEffect } from "react";
import Inventory from "../../nodes/inventory";
import ProductionOrder from "../../nodes/productionOrder";
import Parts from "../../nodes/parts";
import Processing from "../../nodes/processing";
import Assembly from "../../nodes/assembly";
import FinalProduct from "../../nodes/finalProduct";
import { backgroundColor } from "./backgroundTheme/background";
import { color } from "./backgroundTheme/color";
import { variant } from "./backgroundTheme/variant";
import Ribbon from "./ribbon";
import { Maximize2, Minimize2 } from "lucide-react";
import AutoLayoutButton from "../../nodes/autoLayout";
import { fetchProjects, fetchProjectById, saveProject } from "../../API/projectApi";
import { connectSocket, disconnectSocket } from "../../API/socket";
import {
  ReactFlow,
  Background,
  Controls,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import CustomEdge from "../../nodes/customEdge";
import useSession from "../../hooks/useSession";

const nodeTypes = {
  inventory: Inventory,
  productionOrder: ProductionOrder,
  parts: Parts,
  processing: Processing,
  assembly: Assembly,
  finalProduct: FinalProduct,
};

const edgeTypes = { "custom-edge": CustomEdge };

export default function WorkPlace() {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  const [isCollaborative, setIsCollaborative] = useState(false);
  const socketRef = useRef(null);

  // Use a ref so drag/connect callbacks always read the latest projectId
  // without needing to be re-created on every project switch.
  const activeProjectIdRef = useRef(null);
  const [activeProjectId, setActiveProjectId] = useState(null);

  // Mirror full nodes array so onNodeDragStop can emit ALL nodes (not just dragged ones)
  const nodesRef = useRef([]);
  // RAF handle — ensures we emit at most once per animation frame
  const dragRafRef = useRef(null);
  const pendingDragRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [bgColorKey, setBgColorKey] = useState("white");
  const [colorKey, setColorKey] = useState("dark");
  const [variantKey, setVariantKey] = useState("dots");
  const { user, loading } = useSession();

  // Keep the refs in sync whenever state changes
  useEffect(() => {
    activeProjectIdRef.current = activeProjectId;
  }, [activeProjectId]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // ── Fetch project list ────────────────────────────────────────────────────
  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  // ── Load a project ────────────────────────────────────────────────────────
  const handleSelectProject = useCallback(async (projectId) => {
    if (!projectId) {
      setNodes([]);
      setEdges([]);
      setActiveProjectId(null);
      return;
    }
    const project = await fetchProjectById(projectId);
    setNodes(structuredClone(project.nodes));
    setEdges(structuredClone(project.edges));
    setActiveProjectId(project._id);
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSaveProject = useCallback(async () => {
    if (!activeProjectIdRef.current) {
      console.log("no active project to save");
      return;
    }
    await saveProject({
      projectId: activeProjectIdRef.current,
      nodes,
      edges,
    });
    alert("Project saved");
  }, [nodes, edges]);

  // ── Socket / Collaboration ────────────────────────────────────────────────
  useEffect(() => {
    if (!isCollaborative || !activeProjectId) {
      // Tear down existing socket when collaboration is turned off
      if (socketRef.current) {
        if (activeProjectId) {
          socketRef.current.emit("leave-project", activeProjectId);
        }
        disconnectSocket();
        socketRef.current = null;
      }
      return;
    }

    const sock = connectSocket();
    socketRef.current = sock;
    sock.emit("join-project", activeProjectId);

    // Full node-array update — clears dragging:true on all nodes
    const onNodesUpdate = (remoteNodes) => {
      setNodes(structuredClone(remoteNodes).map((n) => ({ ...n, dragging: false })));
    };

    // *** Live drag: update position AND positionAbsolute, mark dragging:true ***
    // React Flow uses positionAbsolute for rendering. Without it the node
    // appears frozen even though 'position' changed in state.
    const onNodeDrag = ({ id, position }) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, position, positionAbsolute: position, dragging: true }
            : n
        )
      );
    };

    // Full edge-array update
    const onEdgesUpdate = (remoteEdges) => {
      setEdges(structuredClone(remoteEdges));
    };

    sock.on("nodes:update", onNodesUpdate);
    sock.on("node:drag", onNodeDrag);
    sock.on("edges:update", onEdgesUpdate);

    return () => {
      sock.off("nodes:update", onNodesUpdate);
      sock.off("node:drag", onNodeDrag);
      sock.off("edges:update", onEdgesUpdate);
      sock.emit("leave-project", activeProjectId);
      disconnectSocket();
      socketRef.current = null;
    };
  }, [isCollaborative, activeProjectId]);

  // ── Node changes (local) ─────────────────────────────────────────────────
  const onNodesChange = useCallback((changes) => {
    setNodes((prev) => applyNodeChanges(changes, prev));
  }, []);

  // ── Edge changes (local) ─────────────────────────────────────────────────
  const onEdgesChange = useCallback((changes) => {
    setEdges((prev) => applyEdgeChanges(changes, prev));
  }, []);

  // ── LIVE DRAG: RAF-throttled, emits id + position once per frame ─────────
  const onNodeDrag = useCallback((_event, node) => {
    if (!socketRef.current || !activeProjectIdRef.current) return;
    // Store latest position; only schedule a new frame if one isn't queued
    pendingDragRef.current = { id: node.id, position: node.position };
    if (dragRafRef.current) return;
    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null;
      if (!socketRef.current || !activeProjectIdRef.current) return;
      const { id, position } = pendingDragRef.current;
      socketRef.current.emit("node:drag", {
        projectId: activeProjectIdRef.current,
        id,
        position,
      });
    });
  }, []);

  // ── DRAG STOP: broadcast FULL node array for authoritative final sync ─────
  // NOTE: allNodes param is only the dragged node(s), NOT the full canvas.
  // Always use nodesRef.current which mirrors the complete nodes state.
  const onNodeDragStop = useCallback(() => {
    if (!socketRef.current || !activeProjectIdRef.current) return;
    socketRef.current.emit("nodes:update", {
      projectId: activeProjectIdRef.current,
      nodes: nodesRef.current,
    });
  }, []);

  // ── Connect edge ──────────────────────────────────────────────────────────
  const onConnect = useCallback((params) => {
    setEdges((prev) => {
      const updated = addEdge(params, prev);
      if (socketRef.current && activeProjectIdRef.current) {
        socketRef.current.emit("edges:update", {
          projectId: activeProjectIdRef.current,
          edges: updated,
        });
      }
      return updated;
    });
  }, []);

  // ── Fullscreen ────────────────────────────────────────────────────────────
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

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) return <div>Loading...</div>;

  if (!user || !user.isApproved) {
    return <div className="p-4">Awaiting approval</div>;
  }

  if (["ADMIN", "SUPER_ADMIN"].includes(user.companyRole)) {
    return <div className="p-4">Admins cannot access workspace</div>;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={fullscreenRef} className="h-full w-full relative">
      <ReactFlow
        key={activeProjectId}
        onlyRenderVisibleElements={true}
        maxZoom={2}
        minZoom={0.1}
        nodes={nodes}
        nodeTypes={nodeTypes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={isCollaborative ? onNodeDrag : undefined}
        onNodeDragStop={isCollaborative ? onNodeDragStop : undefined}
        edgeTypes={edgeTypes}
      >
        <MiniMap
          nodeBorderRadius={50}
          nodeColor={(node) => {
            switch (node.type) {
              case "productionOrder": return "#3b82f6";
              case "inventory":      return "#64748b";
              case "parts":          return "#6366f1";
              case "processing":     return "#10b981";
              case "assembly":       return "#f59e0b";
              case "finalProduct":   return "#84cc16";
              default:               return "blue";
            }
          }}
        />
        <Panel position="top-left">
          <Ribbon
            bgColorKey={bgColorKey}
            setBgColorKey={setBgColorKey}
            colorKey={colorKey}
            setColorKey={setColorKey}
            variantKey={variantKey}
            setVariantKey={setVariantKey}
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
            onSaveProject={handleSaveProject}
            isCollaborative={isCollaborative}
            onToggleCollaborative={setIsCollaborative}
            socketRef={socketRef}
          />
        </Panel>

        <Background
          color={color[colorKey]}
          bgColor={backgroundColor[bgColorKey]}
          variant={variant[variantKey]}
        />

        <Controls className="scale-90">
          {!isFull && (
            <button onClick={handleFullscreen} className="react-flow__controls-button">
              <Maximize2 />
            </button>
          )}
          {isFull && (
            <button onClick={handleExitFullscreen} className="react-flow__controls-button">
              <Minimize2 />
            </button>
          )}
          <AutoLayoutButton />
        </Controls>
      </ReactFlow>
    </div>
  );
}