"use client";

import React from "react";

export const ColorPaletteDemo: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-white mb-8">Color Palette Demo</h1>

      {/* Dark Cyan Colors */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Dark Cyan</h2>
        <div className="grid grid-cols-5 gap-4">
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
            <div key={shade} className="text-center">
              <div
                className={`w-16 h-16 rounded-lg mx-auto mb-2 bg-dark_cyan-${shade}`}
              />
              <p className="text-xs text-white">{shade}</p>
            </div>
          ))}
        </div>
      </div>

      {/* White Colors */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">White</h2>
        <div className="grid grid-cols-5 gap-4">
          {[100, 200, 300, 400, 500].map((shade) => (
            <div key={shade} className="text-center">
              <div
                className={`w-16 h-16 rounded-lg mx-auto mb-2 bg-white-${shade} border border-gray-600`}
              />
              <p className="text-xs text-white">{shade}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Apricot Colors */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Apricot</h2>
        <div className="grid grid-cols-5 gap-4">
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
            <div key={shade} className="text-center">
              <div
                className={`w-16 h-16 rounded-lg mx-auto mb-2 bg-apricot-${shade}`}
              />
              <p className="text-xs text-white">{shade}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tangerine Colors */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Tangerine</h2>
        <div className="grid grid-cols-5 gap-4">
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
            <div key={shade} className="text-center">
              <div
                className={`w-16 h-16 rounded-lg mx-auto mb-2 bg-tangerine-${shade}`}
              />
              <p className="text-xs text-white">{shade}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Jasper Colors */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Jasper</h2>
        <div className="grid grid-cols-5 gap-4">
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
            <div key={shade} className="text-center">
              <div
                className={`w-16 h-16 rounded-lg mx-auto mb-2 bg-jasper-${shade}`}
              />
              <p className="text-xs text-white">{shade}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Examples */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Usage Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Button */}
          <div className="p-6 bg-dark_cyan-600 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              Primary Button
            </h3>
            <button className="bg-tangerine-500 hover:bg-tangerine-600 text-white px-6 py-3 rounded-lg transition-colors">
              Click Me
            </button>
          </div>

          {/* Secondary Button */}
          <div className="p-6 bg-dark_cyan-600 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              Secondary Button
            </h3>
            <button className="bg-apricot-500 hover:bg-apricot-600 text-dark_cyan-300 px-6 py-3 rounded-lg transition-colors">
              Secondary Action
            </button>
          </div>

          {/* Destructive Button */}
          <div className="p-6 bg-dark_cyan-600 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              Destructive Button
            </h3>
            <button className="bg-jasper-500 hover:bg-jasper-600 text-white px-6 py-3 rounded-lg transition-colors">
              Delete
            </button>
          </div>

          {/* Card Example */}
          <div className="p-6 bg-dark_cyan-600 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              Card Example
            </h3>
            <div className="bg-white-100 p-4 rounded-lg">
              <p className="text-dark_cyan-300">
                This is a card with white background and dark cyan text.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Color Values */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Color Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="bg-dark_cyan-700 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Dark Cyan</h4>
            <p className="text-white-300">#588b8b</p>
          </div>
          <div className="bg-white-100 p-4 rounded-lg">
            <h4 className="font-semibold text-dark_cyan-300 mb-2">White</h4>
            <p className="text-dark_cyan-300">#ffffff</p>
          </div>
          <div className="bg-apricot-500 p-4 rounded-lg">
            <h4 className="font-semibold text-dark_cyan-300 mb-2">Apricot</h4>
            <p className="text-dark_cyan-300">#ffd5c2</p>
          </div>
          <div className="bg-tangerine-500 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Tangerine</h4>
            <p className="text-white">#f28f3b</p>
          </div>
          <div className="bg-jasper-500 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Jasper</h4>
            <p className="text-white">#c8553d</p>
          </div>
        </div>
      </div>
    </div>
  );
};

