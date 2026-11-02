# September 25 source workbook inspection

The supplied original is available in Downloads and is never rewritten. Sheet1
has 223 nonempty cells through row121. The reported A1:AB1032 used range includes
empty formatting; it is not 1,032 operational activities. There are no formulas,
hidden rows/columns or defined print areas. C9:L9 is merged. Header row1 contains
Current Action in C, nine departments in D:L, and Time Estimate (min.) in N.
Row2 holds personnel. A/B have no meaningful header labels.

Original print metadata: portrait, overThenDown, gridlines, horizontally centered;
left/right margin0.1in, top0.10576923076923078in, bottom0.8847539015606242in;
header/footer0. The new renderer deliberately uses the requested paper-oriented
Flow layout, not the original awkward portrait settings. All original metadata,
formatting and cell contents remain available in the private XLSX itself.

The regression interpretation is an explicit operator choice, not an automatic
classification of the source: A planned with 12-hour chronological rollover; B
actual start with hours1–6 interpreted as afternoon. Other mappings, including
preserving secondary values without assigning actual semantics, remain available.
Both raw/formatted values and the chosen mapping are retained in provenance.

62 meaningful events and52 department instructions survive. Department-only and
secondary-time-only rows remain represented. Blank spacing is not imported as
operational records. Unknown or prose estimates remain unknown timing, with the
original estimate retained as text. Numbered Current Action values such as
19-1.1 are manual activities until explicitly reconciled to an authorized M03
UUID; no fuzzy linking or fabricated shots occur.

The real browser journey imports, reloads and verifies the original personnel
subheaders, all52 instructions and the private original's byte-for-byte identity.
Repeat confirmation uses a file/sheet batch key and deterministic per-document
object identities. The import is assembled as a bounded CRDT delta before upload
or mutation; failed processing leaves the current Flow untouched.
