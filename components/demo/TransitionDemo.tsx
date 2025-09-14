"use client";

import { useState } from "react";
import Button from "../ui/Button";
import useViewTransition from "../../hooks/useViewTransition";

export default function TransitionDemo() {
  const [currentView, setCurrentView] = useState("home");
  const { navigateWithTransition } = useViewTransition();

  const transitionTypes = [
    {
      type: "slide-left",
      label: "Slide Left",
      description: "Smooth slide from right to left",
    },
    {
      type: "slide-right",
      label: "Slide Right",
      description: "Smooth slide from left to right",
    },
    {
      type: "fade",
      label: "Fade",
      description: "Elegant fade in/out transition",
    },
    { type: "zoom", label: "Zoom", description: "Zoom in/out effect" },
  ];

  const handleTransition = (type: string) => {
    navigateWithTransition("/", {
      type: type as any,
      duration: 500,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          View Transitions API Demo
        </h2>
        <p className="text-white/70">
          Experience smooth page transitions with the modern View Transitions
          API
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {transitionTypes.map((transition) => (
          <div
            key={transition.type}
            className="card-interactive rounded-xl p-6 group"
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              {transition.label}
            </h3>
            <p className="text-sm text-white/60 mb-4">
              {transition.description}
            </p>
            <Button
              onClick={() => handleTransition(transition.type)}
              className="button-interactive w-full"
            >
              Try {transition.label}
            </Button>
          </div>
        ))}
      </div>

      <div className="text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-white/50">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>View Transitions API is supported in your browser</span>
        </div>
      </div>
    </div>
  );
}
