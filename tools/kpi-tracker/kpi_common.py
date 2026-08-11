"""Shared configuration, styles and helpers for the KPI Tracker builder.

HIPAA note: nothing in this module (or anything it generates) stores or expects
patient-identifying information. The intake sheet is keyed on an opaque
"Client ID" that the practice assigns; no name, DOB, contact detail, address or
clinical note ever enters the workbook.
"""

from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# --------------------------------------------------------------------------
# Reference data (mirrors the dropdowns found in the source Lead Data file)
# --------------------------------------------------------------------------

SOURCES = [
    "Friend/Family Member",
    "Physician/Specialist",
    "Web Search",
    "Google Lead",
    "Local Event",
    "Instagram",
    "Facebook",
    "YouTube",
    "BNI Referral",
    "Clarity Fitness",
    "Harmony Nutrition",
    "Other",
]

PT_TYPES = ["Runner", "General", "Sports"]

# Package sizes offered, in visits. "Session to session" and "None" are the
# two non-package outcomes carried over from the original file.
PACKAGE_SIZES = [3, 6, 10, 18]
PACKAGE_OPTIONS = [str(n) for n in PACKAGE_SIZES] + ["Session to session", "None"]

PAYMENT_TYPES = ["In Full", "Over 3 Months", "Session to session"]
YES_NO = ["Yes", "No"]
YES_NO_BYPASS = ["Yes", "No", "Bypassed"]
SCHED_EVAL = ["Yes - On Call", "Yes - After Call", "No"]
PKG_STATUS = ["Yes", "In Progress", "No"]
LEAD_TYPE = ["Lead", "Patient"]

MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

# Sheet names -- kept short and space-free where they appear inside formulas a
# lot, but quoted everywhere regardless so a later rename cannot break them.
SH_START = "Start Here"
SH_SETTINGS = "Settings"
SH_LEADS = "Lead Data"
SH_INPUTS = "Monthly Inputs"
SH_KPI = "KPI Dashboard"
SH_VISUAL = "Dashboard"
SH_PKG = "Package Tracker"
SH_HEALTH = "Data Health"

# Lead Data geometry
LEAD_FIRST_ROW = 2
LEAD_LAST_ROW = 501

# KPI Dashboard geometry
KPI_FIRST_MONTH_COL = 4          # column D = January
KPI_MONTH_START_ROW = 4          # hidden helper: first day of month
KPI_MONTH_END_ROW = 5            # hidden helper: last day of month
KPI_FIRST_METRIC_ROW = 7

COL_METRIC = 1                   # A
COL_GOAL = 2                     # B
COL_YTD = 3                      # C

# --------------------------------------------------------------------------
# Palette / styles
# --------------------------------------------------------------------------

FONT_NAME = "Arial"

NAVY = "1F3864"
BLUE = "2E75B6"
LIGHT_BLUE = "D9E2F3"
PALE = "F2F6FC"
GREY = "595959"
LIGHT_GREY = "F2F2F2"
INPUT_FILL = "FFF2CC"
INPUT_FONT = "0000FF"            # blue = hardcoded input, per model convention
LINK_FONT = "008000"             # green = pulled from another sheet
WHITE = "FFFFFF"
GOOD = "C6EFCE"
BAD = "FFC7CE"
WARN = "FFEB9C"

THIN = Side(style="thin", color="BFBFBF")
MED = Side(style="medium", color=NAVY)


def f(size=10, bold=False, color="000000", italic=False):
    return Font(name=FONT_NAME, size=size, bold=bold, color=color, italic=italic)


def fill(hexcolor):
    return PatternFill("solid", fgColor=hexcolor)


TITLE_FONT = f(16, True, NAVY)
SUBTITLE_FONT = f(10, False, GREY, italic=True)
HDR_FONT = f(10, True, WHITE)
HDR_FILL = fill(NAVY)
SECTION_FONT = f(11, True, WHITE)
SECTION_FILL = fill(BLUE)
SUBSECTION_FONT = f(10, True, NAVY)
SUBSECTION_FILL = fill(LIGHT_BLUE)
INPUT_STYLE_FONT = f(10, False, INPUT_FONT)
INPUT_STYLE_FILL = fill(INPUT_FILL)
LINK_STYLE_FONT = f(10, False, LINK_FONT)
NOTE_FONT = f(9, False, GREY, italic=True)

BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

# Number formats
FMT_INT = '#,##0;(#,##0);"-"'
FMT_MONEY = '$#,##0;($#,##0);"-"'
FMT_MONEY2 = '$#,##0.00;($#,##0.00);"-"'
FMT_PCT = '0.0%;(0.0%);"-"'
FMT_DEC1 = '0.0;(0.0);"-"'
FMT_DEC2 = '0.00;(0.00);"-"'
FMT_RATIO = '0.0"x";(0.0"x");"-"'
FMT_DATE = "mm/dd/yyyy"


def col(idx):
    return get_column_letter(idx)


def month_col(i):
    """i is 0-based month index -> column letter (0 -> 'D')."""
    return get_column_letter(KPI_FIRST_MONTH_COL + i)


def set_widths(ws, widths):
    """widths: dict of column letter -> width."""
    for letter, w in widths.items():
        ws.column_dimensions[letter].width = w


def style_row(ws, row, first_col, last_col, font=None, fillp=None,
              number_format=None, align=None, border=None):
    for c in range(first_col, last_col + 1):
        cell = ws.cell(row=row, column=c)
        if font:
            cell.font = font
        if fillp:
            cell.fill = fillp
        if number_format:
            cell.number_format = number_format
        if align:
            cell.alignment = align
        if border:
            cell.border = border


def banner(ws, row, text, last_col, font=SECTION_FONT, fillp=SECTION_FILL):
    ws.cell(row=row, column=1, value=text)
    style_row(ws, row, 1, last_col, font=font, fillp=fillp,
              align=Alignment(vertical="center"))
    ws.row_dimensions[row].height = 20


def sheet_title(ws, title, subtitle, last_col):
    ws["A1"] = title
    ws["A1"].font = TITLE_FONT
    ws["A2"] = subtitle
    ws["A2"].font = SUBTITLE_FONT
    ws.row_dimensions[1].height = 22
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = "A3"
    return ws
