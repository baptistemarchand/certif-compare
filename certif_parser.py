from py_pdf_parser.loaders import load_file
from pprint import pprint

# from py_pdf_parser.visualise import visualise

document = load_file("soarxs.pdf")
# visualise(document)


def get(name, n=0, y=0):
    return document.elements.to_the_right_of(
        document.elements.filter_by_text_equal(name)[y]
    )[n].text()


def t(label, n=0):
    return [
        get(label, 0, n),
        get(label, 1, n)[0],
        get(label, 1, n)[2:],
        get(label, 2, n),
    ]


result = {
    "classification": get("Classification"),
    "glider_model": get("Glider model"),
    "folding_lines_used": get("Folding lines used"),
    "c01": {
        "result": get("1. Inflation/Take-off"),
        "tests": [
            [
                get("Rising behaviour")[2:],
                get("Rising behaviour", 1),
                get("Rising behaviour", 2),
                "TODO",
            ],
            t("Special take off technique required"),
        ],
    },
    "c02": {
        "result": get("2. Landing"),
        "tests": [t("Special landing technique required")],
    },
    "c03": {
        "result": get("3. Speed in straight flight"),
        "tests": [
            t("Trim speed more than 30 km/h"),
            t("Speed range using the controls larger than 10 km/h"),
            t("Minimum speed"),
        ],
    },
    "c04": {
        "result": get("4. Control movement"),
        "tests": [
            t("Symmetric control pressure / travel"),
            [
                get("Symmetric control pressure / travel", 0, 1),
                get("Symmetric control pressure / travel", 1, 1)[0],
                get("Symmetric control pressure / travel", 2, 1),
                get("Symmetric control pressure / travel", 3, 1),
            ],
            [
                get("Symmetric control pressure / travel", 0, 2),
                get("Symmetric control pressure / travel", 1, 2)[0],
                get("Symmetric control pressure / travel", 2, 2),
                get("Symmetric control pressure / travel", 3, 2),
            ],
        ],
    },
    "c05": {
        "result": get("5. Pitch stability exiting accelerated flight"),
        "tests": [
            t("Dive forward angle on exit"),
            t("Collapse occurs"),
        ],
    },
    "c06": {"result": "TODO", "tests": [t("Collapse occurs", 1)]},
    "c07": {
        "result": get("7. Roll stability and damping"),
        "tests": [t("Oscillations")],
    },
    "c08": {
        "result": get("8. Stability in gentle spirals"),
        "tests": [t("Tendency to return to straight flight", 0)],
    },
    "c09": {
        "result": get("9. Behaviour exiting a fully developed spiral dive"),
        "tests": [
            t("Initial response of glider (first 180°)"),
            t("Tendency to return to straight flight"),
            [
                get("Turn angle to recover normal flight")[2:],
                get("Turn angle to recover normal flight", 0)[0],
                get("Turn angle to recover normal flight", 2),
                get("Turn angle to recover normal flight", 1),
            ],
        ],
    },
    "c10": {
        "result": get("10. Symmetric front collapse"),
        "tests": [
            t("Entry"),
            t("Recovery"),
            [
                get("Dive forward angle on exit Change of course")[2:],
                get("Dive forward angle on exit Change of course", 0)[0],
                get("Dive forward angle on exit Change of course", 2),
                get("Dive forward angle on exit Change of course", 1),
            ],
            t("Cascade occurs"),
            # t("Folding lines used"),
            t("Entry", 1),
            t("Recovery", 1),
            [
                get("Dive forward angle on exit / Change of course", 0)[2:],
                get("Dive forward angle on exit / Change of course", 0)[0],
                get("Dive forward angle on exit / Change of course", 2),
                get("Dive forward angle on exit / Change of course", 1),
            ],
            t("Cascade occurs", 1),
            # t("Folding lines used"),
            t("Entry", 2),
            t("Recovery", 2),
            [
                get("Dive forward angle on exit / Change of course", 0, 1)[2:],
                get("Dive forward angle on exit / Change of course", 0, 1)[0],
                get("Dive forward angle on exit / Change of course", 2, 1),
                get("Dive forward angle on exit / Change of course", 1, 1),
            ],
            t("Cascade occurs", 2),
            # t("Folding lines used"),
        ],
    },
    "c11": {
        "result": get("11. Exiting deep stall (parachutal stall)"),
        "tests": [
            t("Deep stall achieved"),
            t("Recovery", 3),
            t("Dive forward angle on exit", 1),
            t("Change of course"),
            t("Cascade occurs", 3),
        ],
    },
    "c12": {
        "result": get("12. High angle of attack recovery"),
        "tests": [t("Recovery", 4), t("Cascade occurs", 4)],
    },
    "c13": {
        "result": get("13. Recovery from a developed full stall"),
        "tests": [
            t("Dive forward angle on exit", 2),
            t("Collapse"),
            t("Cascade occurs (other than collapses)"),
            t("Rocking back"),
            t("Line tension"),
        ],
    },
    "c14": {
        "result": get("14. Asymmetric collapse"),
        "tests": [
            ["TODO", "TODO", "TODO", "TODO"],
            t("Re-inflation behaviour"),
            t("Total change of course"),
            ["TODO", "TODO", "TODO", "TODO"],
            t("Twist occurs"),
            t("Cascade occurs", 4),
            # Folding lines
            ["TODO", "TODO", "TODO", "TODO"],
            t("Re-inflation behaviour", 1),
            t("Total change of course", 1),
            ["TODO", "TODO", "TODO", "TODO"],
            t("Twist occurs", 1),
            t("Cascade occurs", 5),
            # Folding lines
            ["TODO", "TODO", "TODO", "TODO"],
            t("Re-inflation behaviour", 2),
            t("Total change of course", 2),
            ["TODO", "TODO", "TODO", "TODO"],
            t("Twist occurs", 2),
            t("Cascade occurs", 6),
            # Folding lines
            ["TODO", "TODO", "TODO", "TODO"],
            t("Re-inflation behaviour", 3),
            t("Total change of course", 3),
            ["TODO", "TODO", "TODO", "TODO"],
            t("Twist occurs", 3),
            t("Cascade occurs", 7),
            # Folding lines
        ],
    },
    "c15": {
        "result": "TODO",
        "tests": [
            t("Able to keep course"),
            t("180° turn away from the collapsed side possible in 10 s"),
            ["TODO", "TODO", "TODO", "TODO"],
        ],
    },
    "c16": {
        "result": get("16. Trim speed spin tendency"),
        "tests": [
            t("Spin occurs"),
        ],
    },
    "c17": {
        "result": get("17. Low speed spin tendency"),
        "tests": [
            t("Spin occurs", 1),
        ],
    },
    "c18": {
        "result": get("18. Recovery from a developed spin"),
        "tests": [
            t("Spin rotation angle after release"),
            t("Cascade occurs", 8),
        ],
    },
    "c19": {
        "result": get("19. B-line stall"),
        "tests": [
            t("Change of course before release"),
            t("Behaviour before release"),
            t("Recovery", 5),
            t("Dive forward angle on exit", 3),
            t("Cascade occurs", 9),
        ],
    },
    "c20": {
        "result": get("20. Big ears"),
        "tests": [
            t("Entry procedure"),
            t("Behaviour during big ears"),
            ["TODO", "TODO", "TODO", "TODO"],
            t("Dive forward angle on exit", 4),
        ],
    },
    "c21": {
        "result": get("21. Big ears in accelerated flight"),
        "tests": [
            t("Entry procedure", 1),
            t("Behaviour during big ears", 1),
            ["TODO", "TODO", "TODO", "TODO"],
            t("Dive forward angle on exit", 5),
            ["TODO", "TODO", "TODO", "TODO"],
        ],
    },
    "c22": {
        "result": get("22. Alternative means of directional control"),
        "tests": [
            t("180° turn achievable in 20 s"),
            t("Stall or spin occurs"),
        ],
    },
    "c23": {
        "result": "TODO",
        "tests": [
            t("Procedure works as described"),
            t("Procedure suitable for novice pilots"),
            t("Cascade occurs", 10),
        ],
    },
}

pprint(result)
