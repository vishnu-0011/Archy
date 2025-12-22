import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { 
  ZoomIn, ZoomOut, RotateCcw, Palette, Grid3X3, MousePointer2, ChevronDown
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
      flowchart: { padding: 40, rankSpacing: 70, nodeSpacing: 70, curve: 'basis' }
    },
    defs: {
      plain: 'fill:#0f172a,stroke:#334155,stroke-width:1.5px,color:#f8fafc', 
      db: 'fill:#0c4a6e,stroke:#38bdf8,stroke-width:2px,color:#e0f2fe', 
      queue: 'fill:#78350f,stroke:#fbbf24,stroke-width:2px,color:#fef3c7',
      logic: 'fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#e0e7ff',
      edge: 'fill:#020617,stroke:#334155,stroke-width:1px,color:#64748b'
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
      flowchart: { padding: 40, rankSpacing: 70, nodeSpacing: 70, curve: 'basis' }
    },
    defs: {
      plain: 'fill:#ffffff,stroke:#e2e8f0,stroke-width:1.5px,color:#0f172a',
      db: 'fill:#e0f2fe,stroke:#0369a1,stroke-width:2px,color:#0c4a6e',
      queue: 'fill:#fef3c7,stroke:#b45309,stroke-width:2px,color:#78350f',
      logic: 'fill:#eff6ff,stroke:#2563eb,stroke-width:1.5px,color:#1e40af',
      edge: 'fill:#f8fafc,stroke:#94a3b8,stroke-width:1px,color:#475569'
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
      flowchart: { padding: 50, rankSpacing: 80, nodeSpacing: 80, curve: 'stepChild' }
    },
    defs: {
      plain: 'fill:#2d065d,stroke:#d946ef,stroke-width:2px,color:#fdf4ff',
      db: 'fill:#004a5c,stroke:#22d3ee,stroke-width:2px,color:#cffafe',
      queue: 'fill:#500724,stroke:#f472b6,stroke-width:2px,color:#fdf2f8',
      logic: 'fill:#4a044e,stroke:#f0abfc,stroke-width:2.5px,color:#fdf4ff',
      edge: 'fill:#120224,stroke:#4a044e,stroke-width:1px,color:#a21caf'
    }
  },
  slate: {
    name: 'Industrial Slate',
    bg: '#0f172a',
    gridColor: 'rgba(255, 255, 255, 0.02)',
    config: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#0f172a',
        fontFamily: 'Inter, sans-serif',
        primaryColor: '#1e293b',
        lineColor: '#94a3b8',
        mainBkg: '#1e293b',
        clusterBkg: '#020617',
        clusterBorder: '#475569'
      }
    },
    defs: {
      plain: 'fill:#1e293b,stroke:#475569,stroke-width:1px,color:#f1f5f9',
      db: 'fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#f8fafc',
      queue: 'fill:#334155,stroke:#f59e0b,stroke-width:1.5px,color:#fef3c7',
      logic: 'fill:#1e293b,stroke:#6366f1,stroke-width:1.5px,color:#e0e7ff',
      edge: 'fill:#0f172a,stroke:#334155,stroke-width:1px,color:#94a3b8'
    }
  }
};

const DiagramRenderer: React.FC<DiagramRendererProps> = ({ code, onNodeClick, activeNodeId, extraToolbarContent }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<keyof typeof THEMES>('obsidian');
  const [isRendering, setIsRendering] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const canvasDragRef = useRef<{ startX: number, startY: number, initialPos: {x: number, y: number} } | null>(null);
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
        onWheel={(e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                setScale(s => Math.min(Math.max(0.1, s + e.deltaY * -0.002), 5));
            } else {
                setPosition(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
            }
        }}
      >
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
        .mermaid .cluster rect {
            rx: 16px;
            ry: 16px;
            stroke-width: 1px !important;
            fill-opacity: 0.1 !important;
        }
        .mermaid .cluster .label {
            font-weight: 800 !important;
            letter-spacing: 0.1em !important;
            text-transform: uppercase !important;
            font-size: 13px !important;
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
    </div>
  );
};

export default DiagramRenderer;