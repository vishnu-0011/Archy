import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, RotateCcw, Keyboard, Download, Palette, Check } from 'lucide-react';

interface DiagramRendererProps {
  code: string;
  extraToolbarContent?: React.ReactNode;
}

const THEMES = {
  original: {
    name: 'Original (Light)',
    bg: '#ffffff',
    gridColor: 'rgba(0, 0, 0, 0.06)',
    config: {
      theme: 'default',
      themeVariables: {
        fontFamily: 'Inter, sans-serif',
        primaryColor: '#ffffff',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#374151',
        lineColor: '#374151',
        background: '#ffffff',
        mainBkg: '#ffffff',
        clusterBkg: '#f3f4f6',
        clusterBorder: '#9ca3af',
      }
    },
    defs: {
      plain: null, // Use prompt defaults (fill:#fff, stroke:#333)
      db: null,
      queue: null
    }
  },
  dark: {
    name: 'Cyberpunk',
    bg: '#0d1117',
    gridColor: 'rgba(255, 255, 255, 0.03)',
    config: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#0d1117',
        fontFamily: 'Inter, sans-serif',
        primaryColor: '#1e293b',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#6366f1',
        lineColor: '#94a3b8',
        secondaryColor: '#334155',
        tertiaryColor: '#0f172a',
        mainBkg: '#0d1117',
        clusterBkg: '#161b22',
        clusterBorder: '#30363d',
      }
    },
    defs: {
      plain: 'fill:#1e293b,stroke:#818cf8,stroke-width:2px,color:#e2e8f0', 
      db: 'fill:#1e293b,stroke:#ec4899,stroke-width:2px,color:#e2e8f0', 
      queue: 'fill:#1e293b,stroke:#22c55e,stroke-width:2px,color:#e2e8f0'
    }
  },
  blueprint: {
    name: 'Blueprint',
    bg: '#1e3a8a',
    gridColor: 'rgba(255, 255, 255, 0.1)',
    config: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#1e3a8a',
        fontFamily: 'Inter, sans-serif',
        mainBkg: '#1e3a8a',
        primaryColor: '#172554',
        primaryTextColor: '#bfdbfe',
        lineColor: '#60a5fa',
        primaryBorderColor: '#60a5fa',
        clusterBkg: '#172554',
        clusterBorder: '#60a5fa'
      }
    },
    defs: {
      plain: 'fill:#172554,stroke:#60a5fa,stroke-width:1px,color:#bfdbfe,stroke-dasharray:0',
      db: 'fill:#172554,stroke:#60a5fa,stroke-width:2px,color:#bfdbfe,stroke-dasharray:5 5',
      queue: 'fill:#172554,stroke:#60a5fa,stroke-width:2px,color:#bfdbfe'
    }
  },
  forest: {
    name: 'Forest',
    bg: '#022c22',
    gridColor: 'rgba(255, 255, 255, 0.05)',
    config: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#022c22',
        fontFamily: 'Inter, sans-serif',
        mainBkg: '#022c22',
        primaryColor: '#064e3b',
        primaryTextColor: '#ecfdf5',
        lineColor: '#34d399',
        primaryBorderColor: '#059669',
        clusterBkg: '#065f46',
        clusterBorder: '#047857'
      }
    },
    defs: {
      plain: 'fill:#064e3b,stroke:#34d399,stroke-width:1px,color:#ecfdf5',
      db: 'fill:#065f46,stroke:#34d399,stroke-width:2px,color:#ecfdf5',
      queue: 'fill:#065f46,stroke:#10b981,stroke-width:2px,color:#ecfdf5'
    }
  }
};

const DiagramRenderer: React.FC<DiagramRendererProps> = ({ code, extraToolbarContent }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<keyof typeof THEMES>('original');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  
  const currentThemeConfig = THEMES[theme];

  // Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial global setup - individual themes will override this via directive
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemedCode = (originalCode: string, themeKey: keyof typeof THEMES) => {
    const themeConfig = THEMES[themeKey];
    if (!themeConfig) return originalCode;

    let newCode = originalCode;
    
    // 1. Prepend Init Directive to control global mermaid variables
    if (themeConfig.config) {
        const initDirective = `%%{init: ${JSON.stringify(themeConfig.config)} }%%\n`;
        newCode = initDirective + newCode;
    }

    // 2. Helper to safely replace classDefs
    const replaceClassDef = (name: string, def: string | null) => {
        if (!def) return;
        // Regex looks for "classDef name ..." until newline or semicolon
        const regex = new RegExp(`classDef ${name} [^\\n;]*`, 'g');
        if (regex.test(newCode)) {
            newCode = newCode.replace(regex, `classDef ${name} ${def}`);
        } else {
            // Append if not found (though prompt ensures they exist usually)
            newCode += `\nclassDef ${name} ${def};`;
        }
    };

    replaceClassDef('plain', themeConfig.defs.plain);
    replaceClassDef('db', themeConfig.defs.db);
    replaceClassDef('queue', themeConfig.defs.queue);

    return newCode;
  };

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code) return;
      
      setError(null);
      
      try {
        const id = `mermaid-${Date.now()}`;
        const finalCode = getThemedCode(code, theme);
        const { svg } = await mermaid.render(id, finalCode);
        setSvgContent(svg);
      } catch (err) {
        console.error("Mermaid Render Error:", err);
        setError("Invalid Diagram Syntax. The AI model generated code that Mermaid could not parse.");
      }
    };

    renderDiagram();
  }, [code, theme]);

  // Reset view when code changes (new diagram)
  useEffect(() => {
      if(code) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
      }
  }, [code]);

  // --- Controls Logic ---

  const handleZoom = useCallback((delta: number) => {
    setScale(s => {
        const newScale = s + delta;
        return Math.min(Math.max(0.1, newScale), 5);
    });
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleExport = useCallback(() => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `architecture-diagram-${theme}-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [svgContent, theme]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;

      const PAN_STEP = 40;

      switch (e.key) {
        // Zoom: + / -
        case '=': 
        case '+':
          e.preventDefault();
          handleZoom(0.2);
          break;
        case '-':
          e.preventDefault();
          handleZoom(-0.2);
          break;
        case '0':
          // Reset
          e.preventDefault();
          handleReset();
          break;
        // Pan: Arrows
        case 'ArrowUp':
          e.preventDefault();
          setPosition(p => ({ ...p, y: p.y + PAN_STEP }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setPosition(p => ({ ...p, y: p.y - PAN_STEP }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setPosition(p => ({ ...p, x: p.x + PAN_STEP }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setPosition(p => ({ ...p, x: p.x - PAN_STEP }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoom, handleReset]);


  // Mouse/Wheel Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom with Ctrl/Cmd + Wheel
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.002;
        setScale(s => Math.min(Math.max(0.1, s + delta), 5));
    } else {
        // Pan with Wheel (standard behavior)
        setPosition(p => ({
            x: p.x - e.deltaX,
            y: p.y - e.deltaY
        }));
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-xl relative group">
      {/* Header / Toolbar */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center z-20 shadow-md">
        <span className="text-gray-300 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            Visualizer 
            <span className="text-gray-600">|</span>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-500">
                <span className="flex items-center gap-0.5"><Keyboard className="w-3 h-3"/> + / - to zoom</span>
                <span>•</span>
                <span>Arrows to pan</span>
            </div>
            <span className="sm:hidden text-[10px] text-gray-500">Drag to pan</span>
        </span>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
            {/* Injected Controls (History, Code) */}
            {extraToolbarContent && (
                <div className="flex items-center gap-2 mr-2 border-r border-gray-700 pr-2">
                    {extraToolbarContent}
                </div>
            )}

             {/* Theme Selector */}
             <div className="relative" ref={themeMenuRef}>
                <button 
                    onClick={() => setShowThemeMenu(!showThemeMenu)}
                    className="p-1.5 rounded transition-colors flex items-center gap-2 text-xs font-medium border bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 mr-2"
                    title="Change Theme"
                >
                    <Palette className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Theme</span>
                </button>

                {showThemeMenu && (
                    <div className="absolute top-full mt-1 right-0 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                        {Object.entries(THEMES).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setTheme(key as keyof typeof THEMES);
                                    setShowThemeMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 flex items-center justify-between"
                            >
                                {config.name}
                                {theme === key && <Check className="w-3 h-3 text-indigo-400" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Export Button */}
            <button 
                onClick={handleExport}
                disabled={!svgContent}
                className="p-1.5 rounded transition-colors flex items-center gap-2 text-xs font-medium border bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed mr-2"
                title="Export SVG"
             >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Export</span>
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-gray-900/50 rounded-lg p-1 border border-gray-700">
                <button 
                    onClick={() => handleZoom(-0.2)}
                    className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors active:scale-95"
                    title="Zoom Out (-)"
                >
                    <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] w-10 text-center font-mono text-gray-400 tabular-nums">
                    {Math.round(scale * 100)}%
                </span>
                <button 
                    onClick={() => handleZoom(0.2)}
                    className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors active:scale-95"
                    title="Zoom In (+)"
                >
                    <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-3 bg-gray-700 mx-1"></div>
                <button 
                    onClick={handleReset}
                    className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors active:scale-95"
                    title="Reset View (0)"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
      </div>

      {/* Canvas */}
      <div 
        className={`flex-1 overflow-hidden relative custom-grid cursor-grab active:cursor-grabbing ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{ backgroundColor: currentThemeConfig.bg, transition: 'background-color 0.3s ease' }}
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        tabIndex={0}
      >
        {!code && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 flex-col pointer-events-none select-none">
                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p>No architecture generated yet.</p>
                <p className="text-sm mt-2 opacity-50">Describe your system in the chat to begin.</p>
            </div>
        )}
        
        {error && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-red-400 p-4 border border-red-900/50 bg-red-900/20 rounded max-w-md text-center shadow-lg">
                    <p className="font-bold mb-2">Rendering Error</p>
                    <p className="text-sm font-mono">{error}</p>
                </div>
            </div>
        )}

        {/* Transform Container */}
        <div 
            style={{ 
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'center',
                // Smooth transition for transforms, but instant for dragging to prevent lag
                transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
            className="w-full h-full flex items-center justify-center origin-center will-change-transform"
        >
            {svgContent && !error && (
            <div 
                dangerouslySetInnerHTML={{ __html: svgContent }}
                className="select-none pointer-events-none" 
            />
            )}
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .custom-grid {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, ${currentThemeConfig.gridColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${currentThemeConfig.gridColor} 1px, transparent 1px);
        }
        .mermaid text {
            font-family: 'Inter', sans-serif !important;
        }
      `}</style>
    </div>
  );
};

export default DiagramRenderer;