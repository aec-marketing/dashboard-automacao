import { createTheme } from '@mui/material/styles';

// Identidade A&C (MDS/UI-UX-AC.md): tema claro, azul como cor de ação, amarelo só como destaque,
// laranja só para alerta. Texto de erro usa um laranja mais escuro para manter contraste AA.
const ac = {
  blue: '#233A79',
  blueDark: '#1A2157',
  yellow: '#FDC30B',
  black: '#111021',
  white: '#F2F2F2',
  orange: '#EB5C3D',
  orangeText: '#B33A1B',
  green: '#30AA50',
  greenText: '#1E7A38',
  line: '#C3CBDD',
  tint: '#EEF1F8',
  muted: '#55607F',
};

const title = "'Montserrat', 'Segoe UI', sans-serif";
const body = "'Barlow', 'Segoe UI', sans-serif";

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: ac.blue, dark: ac.blueDark, contrastText: '#FFFFFF' },
    secondary: { main: ac.yellow, contrastText: ac.black },
    error: { main: ac.orange, dark: ac.orangeText, contrastText: ac.black },
    warning: { main: ac.yellow, dark: '#8A6A00', contrastText: ac.black },
    success: { main: ac.green, dark: ac.greenText, contrastText: ac.black },
    info: { main: ac.blue, contrastText: '#FFFFFF' },
    background: { default: ac.white, paper: '#FFFFFF' },
    text: { primary: ac.black, secondary: ac.muted },
    divider: ac.line,
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: body,
    fontSize: 15,
    h1: { fontFamily: title, fontWeight: 800 },
    h2: { fontFamily: title, fontWeight: 800 },
    h3: { fontFamily: title, fontWeight: 800 },
    h4: { fontFamily: title, fontWeight: 700, fontSize: '1.5rem' },
    h5: { fontFamily: title, fontWeight: 700, fontSize: '1.25rem' },
    h6: { fontFamily: title, fontWeight: 700, fontSize: '1.05rem' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, letterSpacing: '0.04em' },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' },
    caption: { fontSize: '0.8rem' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 4, paddingInline: 18 } },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderColor: ac.line } },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 2, fontWeight: 600 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 4 } } },
    MuiDialogTitle: { styleOverrides: { root: { fontFamily: title, fontWeight: 700, color: ac.blue } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: '#FFFFFF', '& .MuiOutlinedInput-notchedOutline': { borderColor: ac.line } },
      },
    },
    MuiFormHelperText: { styleOverrides: { root: { '&.Mui-error': { color: ac.orangeText } } } },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: ac.line, borderRadius: 0 },
        bar: { borderRadius: 0 },
      },
    },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, minHeight: 44 } } },
    MuiTabs: { styleOverrides: { indicator: { height: 3, backgroundColor: ac.blue } } },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderColor: ac.line,
          '&.Mui-selected': { backgroundColor: ac.blue, color: '#FFFFFF', '&:hover': { backgroundColor: ac.blueDark } },
        },
      },
    },
  },
});
