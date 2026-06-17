import { CallSheetDraft } from '../callsheet.types';

function esc(value: string | undefined | null) {
  return String(value ?? '')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

function makeTableRow(values: string[]) {
  return `${values.join(' & ')} \\\\`;
}

function padRows(rows: string[], total: number, cols: number) {
  const out = [...rows];
  while (out.length < total) {
    out.push(makeTableRow(Array.from({ length: cols }, () => '')));
  }
  return out;
}

export function buildCallSheetLatex(draft: CallSheetDraft) {
  const emergencyRows = draft.emergencyContacts.length
    ? draft.emergencyContacts.map((c) =>
        `${esc(c.label)} & ${esc(c.name)} \\hfill \\mbox{${esc(c.phone)}} \\\\`
      )
    : [' &  \\\\'];

  const sceneRows = padRows(
    draft.scenes.map((s) =>
      makeTableRow([
        esc(s.sceneNumber),
        esc(s.setDescription),
        esc(s.castSummary),
        esc(s.dayNight),
        esc(s.pageCount || '---'),
        esc(s.locationNotes),
      ])
    ),
    12,
    6
  );

  const castRows = padRows(
    draft.castCalls.map((c) =>
      makeTableRow([
        esc(c.castName),
        esc(c.roleName),
        esc(c.email),
        esc(c.callTime),
        esc(c.notes),
      ])
    ),
    4,
    5
  );

  const crewRows = draft.crewCalls.length
    ? draft.crewCalls.map((c) =>
        makeTableRow([
          esc(c.departmentRole),
          esc(c.crewName),
          esc(c.email),
          esc(c.callTime),
          esc(c.notes),
        ])
      )
    : [makeTableRow(['', '', '', '', ''])];

  const mainSetAddress = draft.mainSetAddress.length
    ? draft.mainSetAddress.map((line) => `${esc(line)}\\\\`).join('\n')
    : '\\\\';

  const hospitalAddress = draft.nearestHospitalAddress.length
    ? draft.nearestHospitalAddress.map((line) => `${esc(line)}\\\\`).join('\n')
    : '\\\\';

  const crewMessage = draft.distributionMessage || draft.emailIntro;

  const distributionMessageBlock = crewMessage
    ? String.raw`
\vspace{0.18em}
\begin{simplebox}
{\small\bfseries MESSAGE TO CREW}\\[4pt]
${esc(crewMessage)}
\end{simplebox}
`
    : '';

  return String.raw`\documentclass[10pt]{article}

\usepackage[letterpaper,landscape,margin=0.42in]{geometry}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{tabularx}
\usepackage{array}
\usepackage{xcolor}
\usepackage{colortbl}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{titlesec}
\usepackage{booktabs}
\usepackage{ragged2e}
\usepackage[most]{tcolorbox}
\usepackage{fontawesome5}

\setlength{\parindent}{0pt}
\setlength{\parskip}{3pt}
\setlength{\tabcolsep}{4pt}
\renewcommand{\arraystretch}{1.12}
\hypersetup{colorlinks=true,urlcolor=blue}
\pagestyle{empty}

\definecolor{titleblack}{HTML}{111111}
\definecolor{headergray}{HTML}{D9DDE3}
\definecolor{subgray}{HTML}{F5F6F8}
\definecolor{linegray}{HTML}{BFC6CF}
\definecolor{accent}{HTML}{1E2A38}
\definecolor{accent2}{HTML}{5C6B7A}

\titleformat{\section}{\large\bfseries\color{titleblack}}{}{0em}{}
\titlespacing*{\section}{0pt}{0.35em}{0.15em}

\newcolumntype{L}[1]{>{\RaggedRight\arraybackslash}p{#1}}
\newcolumntype{Y}{>{\RaggedRight\arraybackslash}X}

\newtcolorbox{simplebox}[1][]{
    enhanced,
    colback=white,
    colframe=linegray,
    boxrule=0.7pt,
    arc=1.5mm,
    left=2.5mm,
    right=2.5mm,
    top=2mm,
    bottom=2mm,
    #1
}

\newcommand{\sheettitle}[1]{{
    \fontsize{24}{26}\selectfont\bfseries #1
}}

\begin{document}

\begin{center}
    {\sheettitle{VADER: WHITEOUT}}\\[2pt]
    {\fontsize{13}{16}\selectfont\bfseries ${esc(draft.title || 'CALL SHEET')}}\\[4pt]
    {\large\bfseries ${esc(draft.productionDate || 'No date set')} \qquad \textbullet \qquad Primary Crew Call: ${esc(draft.primaryCallTime || '---')}}
\end{center}

\vspace{0.35em}

\noindent
\begin{minipage}[t]{0.29\textwidth}
\begin{simplebox}[height=5.2cm]
{\large\color{accent}\faUsers}\hspace{0.2em}{\small\bfseries EMERGENCY CONTACT}\\[8pt]
{\footnotesize
\renewcommand{\arraystretch}{1.22}
\begin{tabular}{@{}p{0.33\linewidth}p{0.65\linewidth}@{}}
${emergencyRows.join('\n')}
\end{tabular}
}
\end{simplebox}
\end{minipage}
\hfill
\begin{minipage}[t]{0.17\textwidth}
\begin{simplebox}[height=5.2cm]
\centering
{\large\color{accent}\faClock}\hspace{0.25em}{\small\bfseries CALL}\\[12pt]
{\fontsize{24}{26}\selectfont\bfseries ${esc(draft.primaryCallTime || '---')}}\\[20pt]
{\small\bfseries DATE}\\[6pt]
{\large\bfseries ${esc(draft.productionDate || 'No date set')}}
\end{simplebox}
\end{minipage}
\hfill
\begin{minipage}[t]{0.21\textwidth}
\begin{simplebox}[height=5.2cm]
{\large\color{accent}\faCloudSun}\hspace{0.25em}{\small\bfseries WEATHER}\\[8pt]
8:00 AM: ${esc(draft.weatherTempAtCall)}\\
High: ${esc(draft.weatherHigh)}\\
Low: ${esc(draft.weatherLow)}\\
Conditions: ${esc(draft.weatherSummary)}\\
Sunrise: ${esc(draft.sunrise)}\\
Sunset: ${esc(draft.sunset)}
\end{simplebox}
\end{minipage}
\hfill
\begin{minipage}[t]{0.29\textwidth}
\begin{simplebox}[height=5.2cm]
{\large\color{accent}\faMapMarker*}\hspace{0.25em}{\small\bfseries MAIN SET}\\[8pt]
{\bfseries ${esc(draft.mainSetName)}}\\
${mainSetAddress}

\vspace{10pt}
{\large\color{accent}\faHospital}\hspace{0.25em}{\small\bfseries NEAREST HOSPITAL}\\[5pt]
${esc(draft.nearestHospitalName)}\\
${hospitalAddress}
\end{simplebox}
\end{minipage}

\vspace{0.18em}

${distributionMessageBlock}

\section*{Scenes / Set Breakdown}

{\footnotesize
\rowcolors{2}{white}{subgray}
\begin{tabularx}{\textwidth}{L{0.10\textwidth}L{0.31\textwidth}L{0.10\textwidth}L{0.08\textwidth}L{0.08\textwidth}Y}
\rowcolor{headergray}
\textbf{Scene} & \textbf{Set and Description} & \textbf{Cast} & \textbf{D/N} & \textbf{Pages} & \textbf{Location / Notes} \\
${sceneRows.join('\n')}
\end{tabularx}
}

\vspace{0.12em}

\section*{Cast Calls}

{\footnotesize
\rowcolors{2}{white}{subgray}
\begin{tabularx}{\textwidth}{L{0.18\textwidth}L{0.18\textwidth}L{0.26\textwidth}L{0.10\textwidth}Y}
\rowcolor{headergray}
\textbf{Cast} & \textbf{Role} & \textbf{Email} & \textbf{Call} & \textbf{Notes} \\
${castRows.join('\n')}
\end{tabularx}
}

\newpage

\begin{center}
    {\sheettitle{VADER: WHITEOUT}}\\[5pt]
    {\fontsize{13}{16}\selectfont\bfseries CREW CALLS}
\end{center}

\vspace{0.18em}

{\footnotesize
\rowcolors{2}{white}{subgray}
\begin{tabularx}{\textwidth}{L{0.18\textwidth}L{0.19\textwidth}L{0.23\textwidth}L{0.10\textwidth}Y}
\rowcolor{headergray}
\textbf{Dept / Role} & \textbf{Name} & \textbf{Email} & \textbf{Call} & \textbf{Notes} \\
${crewRows.join('\n')}
\end{tabularx}
}

\end{document}
`;
}
