/** Generated metadata; see tools/index-painted-chemical.py. Original PNG bytes unchanged. */
export const PAINTED_CHEMICAL_LAYOUT = {
  "tanks": {
    "image": "assets/painted/chemical/tanks.png",
    "size": [
      1536,
      1024
    ],
    "grid": [
      3,
      2
    ],
    "emptyCells": [
      5
    ],
    "frames": {
      "unknown": {
        "part": "chemical-tank",
        "state": "unknown",
        "usage": "runtime",
        "cell": [
          0,
          0,
          512,
          512
        ],
        "source": [
          139,
          12,
          278,
          486
        ],
        "target": [
          -79.714285714,
          -194.806652807,
          178.714285714,
          196.016632017
        ],
        "anchors": {
          "sourceGround": [
            263,
            495
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          141,
          14,
          274,
          482
        ]
      },
      "identified": {
        "part": "chemical-tank",
        "state": "identified",
        "usage": "runtime",
        "cell": [
          512,
          0,
          512,
          512
        ],
        "source": [
          647,
          12,
          278,
          486
        ],
        "target": [
          -79.714285714,
          -194.806652807,
          178.714285714,
          196.016632017
        ],
        "anchors": {
          "sourceGround": [
            771,
            495
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          649,
          14,
          274,
          482
        ]
      },
      "leaking": {
        "part": "chemical-tank",
        "state": "leaking",
        "usage": "runtime",
        "cell": [
          1024,
          0,
          512,
          512
        ],
        "source": [
          1159,
          12,
          283,
          486
        ],
        "target": [
          -80.357142857,
          -194.806652807,
          181.928571429,
          196.016632017
        ],
        "anchors": {
          "sourceGround": [
            1284,
            495
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          1161,
          14,
          279,
          482
        ]
      },
      "sealed": {
        "part": "chemical-tank",
        "state": "sealed",
        "usage": "runtime",
        "cell": [
          0,
          512,
          512,
          512
        ],
        "source": [
          139,
          524,
          295,
          486
        ],
        "target": [
          -79.714285714,
          -194.806652807,
          189.642857143,
          196.016632017
        ],
        "anchors": {
          "sourceGround": [
            263,
            1007
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          141,
          526,
          291,
          482
        ]
      },
      "destroyed": {
        "part": "chemical-tank",
        "state": "destroyed",
        "usage": "runtime",
        "cell": [
          512,
          512,
          512,
          512
        ],
        "source": [
          627,
          640,
          295,
          370
        ],
        "target": [
          -84.214285714,
          -148.020790021,
          189.642857143,
          149.230769231
        ],
        "anchors": {
          "sourceGround": [
            758,
            1007
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          629,
          642,
          291,
          366
        ]
      }
    }
  },
  "instruments": {
    "image": "assets/painted/chemical/instruments.png",
    "size": [
      1536,
      1024
    ],
    "grid": [
      4,
      2
    ],
    "emptyCells": [
      7
    ],
    "frames": {
      "sample-idle": {
        "part": "sampling-rig",
        "state": "idle",
        "usage": "runtime",
        "cell": [
          0,
          0,
          384,
          512
        ],
        "source": [
          40,
          92,
          315,
          349
        ],
        "target": [
          -74.276527331,
          -137.397101449,
          141.800643087,
          138.588405797
        ],
        "anchors": {
          "sourceGround": [
            205,
            438
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          42,
          94,
          311,
          345
        ]
      },
      "sample-working": {
        "part": "sampling-rig",
        "state": "working",
        "usage": "runtime",
        "cell": [
          384,
          0,
          384,
          512
        ],
        "source": [
          425,
          92,
          314,
          349
        ],
        "target": [
          -73.826366559,
          -137.397101449,
          141.350482315,
          138.588405797
        ],
        "anchors": {
          "sourceGround": [
            589,
            438
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          427,
          94,
          310,
          345
        ]
      },
      "sample-secured": {
        "part": "sampling-rig",
        "state": "secured",
        "usage": "runtime",
        "cell": [
          768,
          0,
          384,
          512
        ],
        "source": [
          809,
          92,
          314,
          349
        ],
        "target": [
          -73.826366559,
          -137.397101449,
          141.350482315,
          138.588405797
        ],
        "anchors": {
          "sourceGround": [
            973,
            438
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          811,
          94,
          310,
          345
        ]
      },
      "sample-lost": {
        "part": "sampling-rig",
        "state": "lost",
        "usage": "runtime",
        "cell": [
          1152,
          0,
          384,
          512
        ],
        "source": [
          1193,
          92,
          312,
          349
        ],
        "target": [
          -73.826366559,
          -137.397101449,
          140.450160772,
          138.588405797
        ],
        "anchors": {
          "sourceGround": [
            1357,
            438
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          1195,
          94,
          308,
          345
        ]
      },
      "ledger-unread": {
        "part": "batch-ledger",
        "state": "unread",
        "usage": "runtime",
        "cell": [
          0,
          512,
          384,
          512
        ],
        "source": [
          33,
          576,
          320,
          385
        ],
        "target": [
          -63.398734177,
          -110.288713911,
          127.594936709,
          111.154855643
        ],
        "anchors": {
          "sourceGround": [
            192,
            958
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          35,
          578,
          316,
          381
        ]
      },
      "ledger-copied": {
        "part": "batch-ledger",
        "state": "copied",
        "usage": "runtime",
        "cell": [
          384,
          512,
          384,
          512
        ],
        "source": [
          417,
          576,
          320,
          385
        ],
        "target": [
          -63.398734177,
          -110.288713911,
          127.594936709,
          111.154855643
        ],
        "anchors": {
          "sourceGround": [
            576,
            958
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          419,
          578,
          316,
          381
        ]
      },
      "ledger-lost": {
        "part": "batch-ledger",
        "state": "lost",
        "usage": "runtime",
        "cell": [
          768,
          512,
          384,
          512
        ],
        "source": [
          801,
          576,
          320,
          385
        ],
        "target": [
          -63.398734177,
          -110.288713911,
          127.594936709,
          111.154855643
        ],
        "anchors": {
          "sourceGround": [
            960,
            958
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          803,
          578,
          316,
          381
        ]
      }
    }
  },
  "valves": {
    "image": "assets/painted/chemical/valves.png",
    "size": [
      1254,
      1254
    ],
    "grid": [
      2,
      2
    ],
    "emptyCells": [],
    "frames": {
      "normal": {
        "part": "field-valve",
        "state": "normal",
        "usage": "runtime",
        "cell": [
          0,
          0,
          627,
          627
        ],
        "source": [
          23,
          83,
          582,
          513
        ],
        "target": [
          -60.9,
          -107.1,
          122.22,
          107.73
        ],
        "anchors": {
          "sourceGround": [
            313,
            593
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          25,
          85,
          578,
          509
        ]
      },
      "working": {
        "part": "field-valve",
        "state": "working",
        "usage": "runtime",
        "cell": [
          627,
          0,
          627,
          627
        ],
        "source": [
          650,
          83,
          581,
          513
        ],
        "target": [
          -60.9,
          -107.1,
          122.01,
          107.73
        ],
        "anchors": {
          "sourceGround": [
            940,
            593
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          652,
          85,
          577,
          509
        ]
      },
      "operated": {
        "part": "field-valve",
        "state": "operated",
        "usage": "runtime",
        "cell": [
          0,
          627,
          627,
          627
        ],
        "source": [
          23,
          710,
          581,
          513
        ],
        "target": [
          -60.9,
          -107.1,
          122.01,
          107.73
        ],
        "anchors": {
          "sourceGround": [
            313,
            1220
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          25,
          712,
          577,
          509
        ]
      },
      "destroyed": {
        "part": "field-valve",
        "state": "destroyed",
        "usage": "runtime",
        "cell": [
          627,
          627,
          627,
          627
        ],
        "source": [
          650,
          845,
          582,
          378
        ],
        "target": [
          -60.9,
          -78.75,
          122.22,
          79.38
        ],
        "anchors": {
          "sourceGround": [
            940,
            1220
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          652,
          847,
          578,
          374
        ]
      }
    }
  },
  "canals": {
    "image": "assets/painted/chemical/canals.png",
    "size": [
      1254,
      1254
    ],
    "grid": [
      2,
      3
    ],
    "emptyCells": [
      5
    ],
    "frames": {
      "open": {
        "part": "canal-junction",
        "state": "open",
        "usage": "runtime",
        "cell": [
          0,
          0,
          627,
          418
        ],
        "source": [
          26,
          209,
          575,
          114
        ],
        "target": [
          -113.593695271,
          -38.85,
          227.583187391,
          39.9
        ],
        "anchors": {
          "sourceGround": [
            313,
            320
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          28,
          211,
          571,
          110
        ]
      },
      "covering": {
        "part": "canal-junction",
        "state": "covering",
        "usage": "runtime",
        "cell": [
          627,
          0,
          627,
          418
        ],
        "source": [
          653,
          209,
          575,
          114
        ],
        "target": [
          -113.593695271,
          -38.85,
          227.583187391,
          39.9
        ],
        "anchors": {
          "sourceGround": [
            940,
            320
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          655,
          211,
          571,
          110
        ]
      },
      "covered": {
        "part": "canal-junction",
        "state": "covered",
        "usage": "runtime",
        "cell": [
          0,
          418,
          627,
          418
        ],
        "source": [
          26,
          602,
          575,
          112
        ],
        "target": [
          -113.593695271,
          -38.15,
          227.583187391,
          39.2
        ],
        "anchors": {
          "sourceGround": [
            313,
            711
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          28,
          604,
          571,
          108
        ]
      },
      "contaminated": {
        "part": "canal-junction",
        "state": "contaminated",
        "usage": "runtime",
        "cell": [
          627,
          418,
          627,
          418
        ],
        "source": [
          653,
          602,
          575,
          113
        ],
        "target": [
          -113.593695271,
          -38.5,
          227.583187391,
          39.55
        ],
        "anchors": {
          "sourceGround": [
            940,
            712
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          655,
          604,
          571,
          109
        ]
      },
      "destroyed": {
        "part": "canal-junction",
        "state": "destroyed",
        "usage": "runtime",
        "cell": [
          0,
          836,
          627,
          418
        ],
        "source": [
          26,
          994,
          573,
          113
        ],
        "target": [
          -113.593695271,
          -38.5,
          226.791593695,
          39.55
        ],
        "anchors": {
          "sourceGround": [
            313,
            1104
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          28,
          996,
          569,
          109
        ]
      }
    },
    "coverOverlay": {
      "source": [
        112,
        609,
        392,
        36
      ],
      "target": [
        -100,
        -37.5,
        200,
        6
      ],
      "sourceFrame": "covered",
      "purpose": "Thin ribbed support surface reused above either clean or contaminated channel body. The renderer still traces chemicalSurfaceAt at the exact contact height."
    }
  },
  "homes": {
    "image": "assets/painted/chemical/homes.png",
    "size": [
      2172,
      724
    ],
    "grid": [
      3,
      1
    ],
    "emptyCells": [],
    "frames": {
      "habitable": {
        "part": "village-supply",
        "state": "habitable",
        "usage": "runtime",
        "cell": [
          0,
          0,
          724,
          724
        ],
        "source": [
          12,
          183,
          694,
          417
        ],
        "target": [
          -122.463768116,
          -180.435835351,
          251.449275362,
          181.743341404
        ],
        "anchors": {
          "sourceGround": [
            350,
            597
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          14,
          185,
          690,
          413
        ]
      },
      "contaminated": {
        "part": "village-supply",
        "state": "contaminated",
        "usage": "runtime",
        "cell": [
          724,
          0,
          724,
          724
        ],
        "source": [
          735,
          183,
          692,
          416
        ],
        "target": [
          -122.826086957,
          -180.0,
          250.724637681,
          181.307506053
        ],
        "anchors": {
          "sourceGround": [
            1074,
            596
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          737,
          185,
          688,
          412
        ]
      },
      "destroyed": {
        "part": "village-supply",
        "state": "destroyed",
        "usage": "runtime",
        "cell": [
          1448,
          0,
          724,
          724
        ],
        "source": [
          1471,
          357,
          691,
          247
        ],
        "target": [
          -118.47826087,
          -106.343825666,
          250.362318841,
          107.651331719
        ],
        "anchors": {
          "sourceGround": [
            1798,
            601
          ],
          "ground": [
            0,
            0
          ]
        },
        "alphaBounds": [
          1473,
          359,
          687,
          243
        ]
      }
    }
  }
};
