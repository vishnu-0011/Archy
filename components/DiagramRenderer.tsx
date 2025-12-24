import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import {
  ZoomIn, ZoomOut, RotateCcw, Palette, Grid3X3, MousePointer2, ChevronDown, Zap, Download
} from 'lucide-react';

interface DiagramRendererProps {
  code: string;
  onNodeClick?: (nodeId: string, label: string) => void;
  activeNodeId?: string | null;
  extraToolbarContent?: React.ReactNode;
}

const THEMES = {
  obsidian: {
    name: 'Obsidian Night',
    bg: '#020617',
    gridColor: 'rgba(56, 189, 248, 0.03)',
    config: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#020617',
        fontFamily: 'Inter, sans-serif',
        primaryColor: '#0f172a',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#334155',
        lineColor: '#38bdf8',
        secondaryColor: '#1e293b',
        tertiaryColor: '#020617',
        mainBkg: '#0f172a',
        clusterBkg: '#0f172a',
        clusterBorder: '#38bdf8',
        nodeBorder: '#1e293b',
        edgeLabelBackground: '#020617',
        compositeBackground: '#020617'
      },
      flowchart: { padding: 50, rankSpacing: 80, nodeSpacing: 60, curve: 'basis' }
    },
    defs: {
      plain: 'fill:#0f172a,stroke:#334155,stroke-width:1.5px,color:#f8fafc,rx:5,ry:5',
      db: 'fill:#0c4a6e,stroke:#38bdf8,stroke-width:2px,color:#e0f2fe,rx:5,ry:5',
      queue: 'fill:#78350f,stroke:#fbbf24,stroke-width:2px,color:#fef3c7,rx:5,ry:5',
      logic: 'fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#e0e7ff,rx:5,ry:5',
      edge: 'fill:#020617,stroke:#334155,stroke-width:1px,color:#64748b,rx:5,ry:5'
    }
  },
  galaxy: {
    name: 'Galaxy Stream',
    bg: '#090014',
    gridColor: 'rgba(124, 58, 237, 0.1)',
    config: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#090014',
        fontFamily: 'Inter, sans-serif',
        primaryColor: '#2e1065',
        primaryTextColor: '#e9d5ff',
        primaryBorderColor: '#7c3aed',
        lineColor: '#a78bfa',
        secondaryColor: '#4c1d95',
        tertiaryColor: '#1e1b4b',
        mainBkg: '#2e1065',
        clusterBkg: '#1e1b4b',
        clusterBorder: '#7c3aed',
        nodeBorder: '#6d28d9',
        edgeLabelBackground: '#090014',
      },
      flowchart: { padding: 50, rankSpacing: 80, nodeSpacing: 60, curve: 'basis' }
    },
    defs: {
      plain: 'fill:#2e1065,stroke:#7c3aed,stroke-width:2px,color:#e9d5ff,rx:8,ry:8',
      db: 'fill:#4c1d95,stroke:#a78bfa,stroke-width:2px,color:#f3e8ff,rx:8,ry:8',
      queue: 'fill:#581c87,stroke:#d8b4fe,stroke-width:2px,color:#f3e8ff,rx:8,ry:8',
      logic: 'fill:#1e1b4b,stroke:#8b5cf6,stroke-width:2px,color:#ddd6fe,stroke-dasharray:5 5,rx:8,ry:8',
      edge: 'fill:#090014,stroke:#6d28d9,stroke-width:1px,color:#a78bfa,rx:8,ry:8'
    }
  },
  blueprint: {
    name: 'System Blueprint',
    bg: '#172554',
    gridColor: 'rgba(147, 197, 253, 0.1)',
    config: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#172554',
        fontFamily: '"Courier New", Courier, monospace',
        primaryColor: '#172554',
        primaryTextColor: '#bfdbfe',
        primaryBorderColor: '#60a5fa',
        lineColor: '#60a5fa',
        secondaryColor: '#1e3a8a',
        tertiaryColor: '#172554',
        mainBkg: '#172554',
        clusterBkg: '#172554',
        clusterBorder: '#3b82f6',
        nodeBorder: '#60a5fa',
        edgeLabelBackground: '#172554',
        compositeBackground: '#172554'
      },
      flowchart: { padding: 50, rankSpacing: 70, nodeSpacing: 60, curve: 'linear' }
    },
    defs: {
      plain: 'fill:#172554,stroke:#60a5fa,stroke-width:2px,color:#bfdbfe',
      db: 'fill:#172554,stroke:#bfdbfe,stroke-width:2px,color:#bfdbfe,shape:cylinder',
      queue: 'fill:#172554,stroke:#93c5fd,stroke-width:2px,color:#bfdbfe',
      logic: 'fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#ffffff,stroke-dasharray:5 5',
      edge: 'fill:#172554,stroke:#1e40af,stroke-width:1px,color:#93c5fd'
    }
  },
  arctic: {
    name: 'Arctic Frost',
    bg: '#f8fafc',
    gridColor: 'rgba(14, 165, 233, 0.05)',
    config: {
      theme: 'base',
      themeVariables: {
        fontFamily: 'Inter, sans-serif',
        primaryColor: '#ffffff',
        primaryTextColor: '#0f172a',
        primaryBorderColor: '#e2e8f0',
        lineColor: '#0ea5e9',
        background: '#f8fafc',
        mainBkg: '#ffffff',
        nodeBorder: '#cbd5e1',
        clusterBkg: '#f1f5f9',
        clusterBorder: '#0ea5e9',
        edgeLabelBackground: '#f8fafc',
        compositeBackground: '#f8fafc'
      },
      flowchart: { padding: 50, rankSpacing: 80, nodeSpacing: 60, curve: 'basis' }
    },
    defs: {
      plain: 'fill:#ffffff,stroke:#e2e8f0,stroke-width:1.5px,color:#0f172a,rx:5,ry:5',
      db: 'fill:#e0f2fe,stroke:#0369a1,stroke-width:2px,color:#0c4a6e,rx:5,ry:5',
      queue: 'fill:#fef3c7,stroke:#b45309,stroke-width:2px,color:#78350f,rx:5,ry:5',
      logic: 'fill:#eff6ff,stroke:#2563eb,stroke-width:1.5px,color:#1e40af,rx:5,ry:5',
      edge: 'fill:#f8fafc,stroke:#94a3b8,stroke-width:1px,color:#475569,rx:5,ry:5'
    }
  },
  synthwave: {
    name: 'Neon Pulse',
    bg: '#120224',
    gridColor: 'rgba(217, 70, 239, 0.05)',
    config: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#120224',
        fontFamily: 'JetBrains Mono, monospace',
        primaryColor: '#2d065d',
        primaryTextColor: '#fdf4ff',
        lineColor: '#d946ef',
        mainBkg: '#2d065d',
        clusterBkg: '#1a0b2e',
        clusterBorder: '#f0abfc',
        nodeBorder: '#701a75',
        edgeLabelBackground: '#120224'
      },
      flowchart: { padding: 60, rankSpacing: 90, nodeSpacing: 70, curve: 'linear' }
    },
    defs: {
      plain: 'fill:#2d065d,stroke:#d946ef,stroke-width:2px,color:#fdf4ff',
      db: 'fill:#004a5c,stroke:#22d3ee,stroke-width:2px,color:#cffafe',
      queue: 'fill:#500724,stroke:#f472b6,stroke-width:2px,color:#fdf2f8',
      logic: 'fill:#4a044e,stroke:#f0abfc,stroke-width:2.5px,color:#fdf4ff',
      edge: 'fill:#120224,stroke:#4a044e,stroke-width:1px,color:#a21caf'
    }
  }
};

const DiagramRenderer: React.FC<DiagramRendererProps> = ({ code, onNodeClick, activeNodeId, extraToolbarContent }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<keyof typeof THEMES>('obsidian');
  const [isRendering, setIsRendering] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [scale, setScale] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [animateEdges, setAnimateEdges] = useState(true);

  const canvasDragRef = useRef<{ startX: number, startY: number, initialPos: { x: number, y: number } } | null>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
    });
  }, []);

  const getThemedCode = (originalCode: string, themeKey: keyof typeof THEMES) => {
    const themeConfig = THEMES[themeKey];
    let newCode = originalCode;
    if (themeConfig.config) {
      newCode = `%%{init: ${JSON.stringify(themeConfig.config)} }%%\n` + newCode;
    }
    const replaceClassDef = (name: string, def: string) => {
      const regex = new RegExp(`classDef ${name} [^\\n;]*`, 'g');
      if (regex.test(newCode)) newCode = newCode.replace(regex, `classDef ${name} ${def},rx:10,ry:10`);
      else newCode += `\nclassDef ${name} ${def},rx:10,ry:10;`;
    };
    Object.entries(themeConfig.defs).forEach(([name, def]) => replaceClassDef(name, def));
    return newCode;
  };

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code) return;
      setIsRendering(true);
      setError(null);
      try {
        const id = `mermaid-${Date.now()}`;
        const finalCode = getThemedCode(code, theme);
        const { svg } = await mermaid.render(id, finalCode);
        setSvgContent(svg);
      } catch (err) {
        console.error("Mermaid Render Error:", err);
        setError("Diagram Syntax Error.");
      } finally {
        setIsRendering(false);
      }
    };
    renderDiagram();
  }, [code, theme]);

  useEffect(() => {
    if (!svgContent || !svgWrapperRef.current) return;
    const wrapper = svgWrapperRef.current;
    const nodes = wrapper.querySelectorAll('.node');
    nodes.forEach((node) => {
      const g = node as SVGGElement;
      g.style.cursor = 'pointer';
      const onClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const fullId = g.id;
        const nodeId = fullId.replace(/^flowchart-/, '').split('-')[0];
        const label = g.querySelector('.label')?.textContent || '';
        onNodeClick?.(nodeId, label);
      };
      g.addEventListener('click', onClick);
    });
  }, [svgContent, onNodeClick]);

  // Auto-center when diagram changes
  useEffect(() => {
    if (svgContent) {
      setPosition({ x: 0, y: 0 });
      setScale(0.8);
    }
  }, [svgContent]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent default behavior for zoom (ctrl + scroll) to avoid browser zoom
      if (e.ctrlKey) {
        e.preventDefault();
        setScale(s => Math.min(Math.max(0.1, s + e.deltaY * -0.002), 5));
      } else {
        // For panning, we update position. 
        // Note: We don't preventDefault here to allow normal scrolling if needed, 
        // but typically for a canvas pan you might want to. 
        // The original code didn't preventDefault for pan, so we keep that behavior 
        // unless it interferes, but since this is a "passive listener" error fix, 
        // the main culprit was the e.preventDefault() inside the ctrlKey block.
        // We'll optionally prevent scroll if it's considered a "canvas" interaction.
        // For now, mirroring original logic: only prevent on zoom.
        setPosition(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };

    // { passive: false } is crucial to allow e.preventDefault()
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (canvasDragRef.current) {
      const drag = canvasDragRef.current;
      setPosition({
        x: drag.initialPos.x + (e.clientX - drag.startX),
        y: drag.initialPos.y + (e.clientY - drag.startY)
      });
    }
  };

  const handleMouseUp = () => {
    canvasDragRef.current = null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    canvasDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPos: { ...position }
    };
  };

  const handleZoom = useCallback((delta: number) => {
    setScale(s => Math.min(Math.max(0.1, s + delta), 5));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleDownload = () => {
    if (!svgWrapperRef.current) return;

    const svgElement = svgWrapperRef.current.querySelector('svg');
    if (!svgElement) return;

    // Serialize SVG with correct dimensions
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    // Ensure namespace
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    // Add explicit width/height if missing to ensure canvas draws it
    const bbox = svgElement.getBoundingClientRect();
    const width = bbox.width;
    const height = bbox.height;

    // Convert to Base64 using URL-safe encoding for Unicode characters
    const svg64 = btoa(unescape(encodeURIComponent(source)));
    const image64 = 'data:image/svg+xml;base64,' + svg64;

    const img = new Image();
    img.src = image64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // High-res export
      const scaleFactor = 2;
      canvas.width = width * scaleFactor;
      canvas.height = height * scaleFactor;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background
      ctx.fillStyle = THEMES[theme].bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Trigger download
      const link = document.createElement('a');
      link.download = `archmind-diagram-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative">
      <div className="bg-gray-850 px-5 py-3 border-b border-gray-800 flex justify-between items-center z-20 shadow-lg">
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            Architecture View
            <span className={`w-1.5 h-1.5 rounded-full ${isRendering ? 'bg-indigo-400 animate-pulse' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'}`}></span>
          </span>
          <div className="h-4 w-[1px] bg-gray-700" />

          <div className="flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-xl p-1">
            <div className="p-1.5 text-indigo-400 bg-indigo-400/10 rounded-lg shadow-inner">
              <MousePointer2 className="w-4 h-4" />
            </div>
          </div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg transition-all ${showGrid ? 'text-indigo-400 bg-indigo-400/10' : 'text-gray-500 hover:text-gray-300'}`}
            title="Toggle Grid"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setAnimateEdges(!animateEdges)}
            className={`p-1.5 rounded-lg transition-all ${animateEdges ? 'text-amber-400 bg-amber-400/10' : 'text-gray-500 hover:text-gray-300'}`}
            title="Toggle Edge Animation"
          >
            <Zap className="w-4 h-4" fill={animateEdges ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {extraToolbarContent}
          <div className="h-4 w-[1px] bg-gray-700 mx-1" />

          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-semibold border bg-gray-900 border-gray-700 text-gray-300 hover:border-indigo-500 hover:text-white"
            >
              <Palette className="w-4 h-4 text-indigo-400" />
              <span className="hidden xl:inline capitalize">{THEMES[theme].name}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showThemeMenu ? 'rotate-180' : ''}`} />
            </button>

            {showThemeMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {Object.entries(THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => { setTheme(key as any); setShowThemeMenu(false); }}
                    className={`w-full text-left px-4 py-3 text-xs font-medium flex items-center justify-between transition-colors ${theme === key ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                  >
                    {t.name}
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.bg }}></div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 bg-gray-950/80 rounded-xl p-1 border border-gray-800">
            <button onClick={handleDownload} className="p-1.5 hover:bg-gray-800 text-indigo-400 rounded-lg transition-colors" title="Download PNG"><Download className="w-4 h-4" /></button>
            <div className="w-[1px] h-4 bg-gray-800 mx-0.5" />
            <button onClick={() => handleZoom(-0.2)} className="p-1.5 hover:bg-gray-800 text-gray-500 rounded-lg transition-colors"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={() => handleZoom(0.2)} className="p-1.5 hover:bg-gray-800 text-gray-500 rounded-lg transition-colors"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={handleReset} className="p-1.5 hover:bg-gray-800 text-gray-500 rounded-lg transition-colors"><RotateCcw className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div
        className={`flex-1 overflow-hidden relative ${showGrid ? 'custom-grid' : ''} cursor-grab active:cursor-grabbing transition-colors duration-500`}
        style={{ backgroundColor: THEMES[theme].bg }}
        ref={containerRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className={`w-full h-full ${animateEdges ? 'flow-animation' : ''}`}>
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center',
            }}
            className={`w-full h-full flex items-center justify-center transition-opacity duration-300 ${isRendering ? 'opacity-40' : 'opacity-100'}`}
          >
            {error ? (
              <div className="text-red-400 text-sm font-mono flex flex-col items-center gap-3 animate-pulse">
                <span className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl shadow-2xl">{error}</span>
              </div>
            ) : (
              <div
                ref={svgWrapperRef}
                dangerouslySetInnerHTML={{ __html: svgContent }}
                className="select-none transition-transform duration-75"
              />
            )}
          </div>
        </div>

        <style>{`
        .custom-grid {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, ${THEMES[theme].gridColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${THEMES[theme].gridColor} 1px, transparent 1px);
        }
        .mermaid .node {
            transition: filter 0.2s ease, transform 0.2s ease;
        }
        .mermaid .node rect, .mermaid .node circle, .mermaid .node polygon, .mermaid .node path {
            transition: filter 0.2s ease, transform 0.2s ease;
        }
        /* Clear, readable node labels */
        .mermaid .node .label {
            font-size: 18px !important;
            font-weight: 700 !important;
            line-height: 1.4 !important;
            font-family: 'Inter', sans-serif !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5); 
        }
        /* Make edge labels readable */
        .mermaid .edgeLabel .label {
            font-size: 14px !important;
            font-weight: 600 !important;
            padding: 4px !important;
            background-color: ${THEMES[theme].config.themeVariables.edgeLabelBackground};
            border-radius: 4px;
        }
        .mermaid .cluster .label {
            font-weight: 800 !important;
            letter-spacing: 0.1em !important;
            text-transform: uppercase !important;
            font-size: 24px !important; /* Prominent but not overwhelming */
            fill: ${THEMES[theme].config.themeVariables.primaryTextColor} !important;
            filter: drop-shadow(0 0 5px ${THEMES[theme].bg});
            opacity: 0.9;
        }
        .mermaid .cluster rect {
            rx: 16px;
            ry: 16px;
            stroke-width: 2px !important;
            fill-opacity: 0.15 !important;
        }
        .mermaid .edgePath path {
            stroke-width: 2px !important;
            transition: stroke-width 0.2s ease;
        }
        .mermaid .node:hover rect {
            stroke-width: 3px !important;
            stroke: #6366f1 !important;
            filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.4));
        }
        ${activeNodeId ? `
        .mermaid .node[id*="${activeNodeId}"] rect {
            stroke-width: 4px !important;
            stroke: #6366f1 !important;
            fill-opacity: 0.9 !important;
            filter: drop-shadow(0 0 15px rgba(99, 102, 241, 0.6)) !important;
        }
        ` : ''}
      `}</style>

        {/* Dynamic styles specifically for animation and themes */}
        <style>{`
        @keyframes flowDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .flow-animation .mermaid .edgePath path {
          stroke-dasharray: 10, 5;
          animation: flowDash 1s linear infinite;
        }
        /* Enhance glow for galaxy theme */
        ${theme === 'galaxy' ? `
        .mermaid .node rect, .mermaid .node circle, .mermaid .node polygon {
            filter: drop-shadow(0 0 8px rgba(124, 58, 237, 0.3));
        }
        .mermaid .edgePath path {
            filter: drop-shadow(0 0 3px rgba(167, 139, 250, 0.3));
        }
        ` : ''}
      `}</style>
      </div>
    </div>
  );
};

export default DiagramRenderer;