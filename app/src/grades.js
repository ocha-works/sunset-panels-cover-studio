// Colour grades: the sunset-or-neon wash that makes a plain photo read as
// poster art. A grade is four things: a CSS filter string applied while the
// photo is drawn, a three-stop overlay gradient laid over each panel, the
// colours of the title lettering's gradient fill, and the banner colour that
// backs the subtitle. The `sky` pair colours the drawn placeholder scene a
// panel shows before any photo is loaded into it.

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.32) contrast(1.08) brightness(1.04)',
    overlay: ['rgba(255, 122, 61, 0.16)', 'rgba(255, 46, 136, 0.20)', 'rgba(38, 12, 78, 0.30)'],
    title: ['#ffffff', '#ffd166', '#ff5e8a'],
    banner: '#ff2e88',
    sky: ['#351259', '#ff7a3d'],
    sea: '#1d0b38',
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.45) contrast(1.14) brightness(0.98) hue-rotate(-8deg)',
    overlay: ['rgba(0, 229, 255, 0.14)', 'rgba(120, 0, 255, 0.20)', 'rgba(255, 0, 110, 0.26)'],
    title: ['#eaffff', '#4de3ff', '#ff4dd8'],
    banner: '#00b8d9',
    sky: ['#0b1035', '#7a1fa2'],
    sea: '#070a24',
  },
  golden: {
    label: 'Golden Hour',
    filter: 'saturate(1.18) contrast(1.05) brightness(1.07) sepia(0.22)',
    overlay: ['rgba(255, 190, 80, 0.18)', 'rgba(255, 120, 40, 0.16)', 'rgba(90, 40, 10, 0.24)'],
    title: ['#fffbe8', '#ffe08a', '#ff9a3d'],
    banner: '#e07b24',
    sky: ['#4a2408', '#ffb347'],
    sea: '#2a1408',
  },
  noir: {
    label: 'Midnight Noir',
    filter: 'saturate(0.35) contrast(1.22) brightness(0.96)',
    overlay: ['rgba(140, 170, 255, 0.10)', 'rgba(30, 40, 90, 0.18)', 'rgba(0, 0, 10, 0.38)'],
    title: ['#ffffff', '#cfd8ff', '#7d8fc9'],
    banner: '#3d4a7a',
    sky: ['#0a0d1f', '#3d4a7a'],
    sea: '#05060f',
  },
};
