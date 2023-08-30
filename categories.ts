export const categories = [
  { // 1. takeoff
    key: "c01",
    label: "Inflation/Take-off",
    testLabels: [
      "rising behaviour",
      "Special take off technique required",
    ],
  },
  { // 2. landing
    key: "c02",
    label: "Landing",
    testLabels: ["Special landing technique required"],
  },
  { // 3. speed
    key: "c03",
    label: "Speed in straight flight",
    testLabels: [
      "Trim speed more than 30 km/h",
      "Speed range using the controls larger than 10 km/h",
      "Minimum speed",
    ],
  },
  { // 4. control
    key: "c04",
    label: "Control movement",
    testLabels: [
      "Symmetric control pressure / travel (<80kg)",
      "Symmetric control pressure / travel (80kg><100kg)",
      "Symmetric control pressure / travel (>100kg)",
    ],
  },
  { // 5. exitAcceleratedFlight
    key: "c05",
    label: "Pitch stability exiting accelerated flight",
    testLabels: [
      "Dive forward angle on exit",
      "Collapse occurs",
    ],
  },
  { // 6. acceleratedControls
    key: "c06",
    label: "Pitch stability operating controls during accelerated A flight",
    testLabels: ["Collapse occurs"],
  },
  { // 7. roll
    key: "c07",
    label: "Roll stability and damping",
    testLabels: ["Oscillations"],
  },
  { // 8. gentleSpiral
    key: "c08",
    label: "Stability in gentle spirals",
    testLabels: ["Tendency to return to straight flight"],
  },
  { // 9. fullSpiral
    key: "c09",
    label: "Behaviour exiting a fully developed spiral dive",
    testLabels: [
      "Initial response of glider (first 180°)",
      "Tendency to return to straight flight",
      "Turn angle to recover normal flight",
    ],
  },
  {
    key: "c10",
    label: "Symmetric front collapse",
    testLabels: [
      "30% chord / Entry",
      "30% chord / Recovery",
      "30% chord / Dive forward angle on exit Change of course",
      "30% chord / Cascade occurs",
      "50% chord / Entry",
      "50% chord / Recovery",
      "50% chord / Dive forward angle on exit Change of course",
      "50% chord / Cascade occurs",
      "With accelerator / Entry",
      "With accelerator / Recovery",
      "With accelerator / Dive forward angle on exit Change of course",
      "With accelerator / Cascade occurs",
    ],
  },
  {
    key: "c11",
    label: "Exiting deep stall (parachutal stall)",
    testLabels: [
      "Deep stall achieved",
      "Recovery",
      "Dive forward angle on exit",
      "Change of course",
      "Cascade occurs",
    ],
  },
  {
    key: "c12",
    label: "High angle of attack recovery",
    testLabels: [
      "Recovery",
      "Cascade occurs",
    ],
  },
  {
    key: "c13",
    label: "Recovery from a developed full stall",
    testLabels: [
      "Dive forward angle on exit",
      "Collapse",
      "Cascade occurs (other than collapses)",
      "Rocking back",
      "Line tension",
    ],
  },
  {
    key: "c14",
    label: "Asymmetric collapse",
    testLabels: [
      "Small / Change of course until re-inflation / Maximum dive forward or roll angle",
      "Small / Re-inflation behaviour",
      "Small / Total change of course",
      "Small / Collapse on the opposite side occurs",
      "Small / Twist occurs",
      "Small / Cascade occurs",
      // Folding lines
      "Large / Change of course until re-inflation / Maximum dive forward or roll angle",
      "Large / Re-inflation behaviour",
      "Large / Total change of course",
      "Large / Collapse on the opposite side occurs",
      "Large / Twist occurs",
      "Large / Cascade occurs",
      // Folding lines
      "Small accelerated / Change of course until re-inflation / Maximum dive forward or roll angle",
      "Small accelerated / Re-inflation behaviour",
      "Small accelerated / Total change of course",
      "Small accelerated / Collapse on the opposite side occurs",
      "Small accelerated / Twist occurs",
      "Small accelerated / Cascade occurs",
      // Folding lines
      "Large accelerated / Change of course until re-inflation / Maximum dive forward or roll angle",
      "Large accelerated / Re-inflation behaviour",
      "Large accelerated / Total change of course",
      "Large accelerated / Collapse on the opposite side occurs",
      "Large accelerated / Twist occurs",
      "Large accelerated / Cascade occurs",
      // Folding lines
    ],
  },
  {
    key: "c15",
    label: "Directional control with a maintained asymmetric collapse",
    testLabels: [
      "Able to keep course",
      "180° turn away from the collapsed side possible in 10 s",
      "Amount of control range between turn and stall or spin",
    ],
  },
  {
    key: "c16",
    label: "Trim speed spin tendency",
    testLabels: ["Spin occurs"],
  },
  {
    key: "c17",
    label: "Low speed spin tendency",
    testLabels: ["Spin occurs"],
  },
  {
    key: "c18",
    label: "Recovery from a developed spin",
    testLabels: [
      "Spin rotation angle after release",
      "Cascade occurs",
    ],
  },
  {
    key: "c19",
    label: "B-line stall",
    testLabels: [
      "Change of course before release",
      "Behaviour before release",
      "Recovery",
      "Dive forward angle on exit",
      "Cascade occurs",
    ],
  },
  {
    key: "c20",
    label: "Big ears",
    testLabels: [
      "Entry procedure",
      "Behaviour during big ears",
      "Recovery",
      "Dive forward angle on exit",
    ],
  },
  {
    key: "c21",
    label: "Big ears in accelerated flight",
    testLabels: [
      "Entry procedure",
      "Behaviour during big ears",
      "Recovery",
      "Dive forward angle on exit",
      "Behaviour immediately after releasing the accelerator while maintaining big ears",
    ],
  },
  {
    key: "c22",
    label: "Alternative means of directional control",
    testLabels: [
      "180° turn achievable in 20 s",
      "Stall or spin occurs",
    ],
  },
  {
    key: "c23",
    label:
      "Any other flight procedure and/or configuration described in the user's manual",
    testLabels: [
      "Procedure works as described",
      "Procedure suitable for novice pilots",
      "Cascade occurs",
    ],
  },
] as const;
export type CategoryKey = (typeof categories)[number]["key"];
