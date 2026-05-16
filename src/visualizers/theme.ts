/** Global Plotly theme (dark, matching the CSS palette). */

export const darkTheme = {
  paper_bgcolor: '#0f1115',
  plot_bgcolor: '#0f1115',
  font: { color: '#cfd6e4', family: 'Inter, system-ui, sans-serif', size: 12 },
  xaxis: {
    gridcolor: '#1f2330',
    zerolinecolor: '#2a3142',
    linecolor: '#2a3142',
    tickcolor: '#2a3142'
  },
  yaxis: {
    gridcolor: '#1f2330',
    zerolinecolor: '#2a3142',
    linecolor: '#2a3142',
    tickcolor: '#2a3142'
  },
  colorway: ['#22d3ee', '#f472b6', '#a78bfa', '#facc15', '#34d399', '#fb923c'],
  margin: { l: 50, r: 20, t: 36, b: 40 }
};

export const accent = {
  primary: '#22d3ee',
  magenta: '#f472b6',
  purple: '#a78bfa',
  yellow: '#facc15',
  green: '#34d399'
};
