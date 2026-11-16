/** Metadata only; original PNGs are immutable. See tools/index-painted-route.py. */
export const PAINTED_ROUTE_LAYOUT = {
  "barrier": {
    "image": "assets/painted/route/barrier.png",
    "size": [
      1254,
      1254
    ],
    "grid": [
      2,
      3
    ],
    "rowBoundaries": [
      0,
      418,
      815,
      1254
    ],
    "frames": {
      "pedestal": {
        "cell": [
          0,
          0,
          627,
          418
        ],
        "source": [
          201,
          24,
          198,
          375
        ],
        "alphaBounds": [
          203,
          26,
          194,
          371
        ],
        "usage": "runtime",
        "target": [
          -95.453608247,
          -101.13028169,
          34.701030928,
          101.672535211
        ],
        "anchors": {
          "hinge": {
            "source": [
              312,
              113
            ],
            "world": [
              -76,
              -77
            ]
          }
        }
      },
      "arm": {
        "cell": [
          627,
          0,
          627,
          418
        ],
        "source": [
          636,
          170,
          595,
          89
        ],
        "alphaBounds": [
          638,
          172,
          591,
          85
        ],
        "usage": "runtime",
        "target": [
          -13.056363636,
          -8.282352941,
          180.663636364,
          16.752941176
        ],
        "anchors": {
          "hinge": {
            "source": [
              679,
              214
            ],
            "world": [
              0,
              0
            ]
          }
        }
      },
      "pedestal-broken": {
        "cell": [
          0,
          418,
          627,
          397
        ],
        "source": [
          198,
          447,
          200,
          346
        ],
        "alphaBounds": [
          200,
          449,
          196,
          342
        ],
        "usage": "runtime",
        "target": [
          -93.525773196,
          -96.431266846,
          35.051546392,
          96.991913747
        ],
        "anchors": {
          "ground": {
            "source": [
              298.0,
              791
            ],
            "world": [
              -76,
              0
            ]
          }
        }
      },
      "arm-broken": {
        "cell": [
          627,
          418,
          627,
          397
        ],
        "source": [
          627,
          658,
          603,
          82
        ],
        "alphaBounds": [
          629,
          660,
          599,
          78
        ],
        "usage": "runtime",
        "target": [
          -82.195431472,
          -43.076923077,
          170.390862944,
          44.153846154
        ],
        "anchors": {
          "ground": {
            "source": [
              928.5,
              738
            ],
            "world": [
              3,
              0
            ]
          }
        }
      },
      "control": {
        "cell": [
          0,
          815,
          627,
          439
        ],
        "source": [
          143,
          832,
          317,
          392
        ],
        "alphaBounds": [
          145,
          834,
          313,
          388
        ],
        "usage": "runtime",
        "target": [
          -28.357827476,
          -52.268041237,
          56.715654952,
          52.536082474
        ],
        "anchors": {
          "ground": {
            "source": [
              301.5,
              1222
            ],
            "world": [
              0,
              0
            ]
          }
        }
      },
      "control-broken": {
        "cell": [
          627,
          815,
          627,
          439
        ],
        "source": [
          746,
          833,
          349,
          390
        ],
        "alphaBounds": [
          748,
          835,
          345,
          386
        ],
        "usage": "runtime",
        "target": [
          -28.324637681,
          -50.259067358,
          56.649275362,
          50.518134715
        ],
        "anchors": {
          "ground": {
            "source": [
              920.5,
              1221
            ],
            "world": [
              0,
              0
            ]
          }
        }
      }
    }
  },
  "terminals": {
    "image": "assets/painted/route/terminals.png",
    "size": [
      1254,
      1254
    ],
    "grid": [
      2,
      4
    ],
    "rowBoundaries": [
      0,
      314,
      627,
      940,
      1254
    ],
    "frames": {
      "map-concealed": {
        "cell": [
          0,
          0,
          627,
          314
        ],
        "source": [
          139,
          12,
          353,
          286
        ],
        "alphaBounds": [
          141,
          14,
          349,
          282
        ],
        "usage": "runtime",
        "target": [
          -49.561604585,
          -112.794326241,
          99.123209169,
          113.588652482
        ],
        "anchors": {
          "ground": {
            "source": [
              315.5,
              296
            ],
            "world": [
              0,
              0
            ]
          }
        }
      },
      "map-surveyed": {
        "cell": [
          627,
          0,
          627,
          314
        ],
        "source": [
          766,
          12,
          353,
          287
        ],
        "alphaBounds": [
          768,
          14,
          349,
          283
        ],
        "usage": "runtime",
        "target": [
          -49.561604585,
          -112.791519435,
          99.123209169,
          113.583038869
        ],
        "anchors": {
          "ground": {
            "source": [
              942.5,
              297
            ],
            "world": [
              0,
              0
            ]
          }
        }
      },
      "terminal-idle": {
        "cell": [
          0,
          314,
          627,
          313
        ],
        "source": [
          244,
          318,
          158,
          299
        ],
        "alphaBounds": [
          246,
          320,
          154,
          295
        ],
        "usage": "runtime",
        "target": [
          -19.493506494,
          -70.474576271,
          38.987012987,
          70.949152542
        ],
        "anchors": {
          "ground": {
            "source": [
              323.0,
              615
            ],
            "world": [
              0,
              0
            ]
          }
        }
      },
      "terminal-working": {
        "cell": [
          627,
          314,
          627,
          313
        ],
        "source": [
          871,
          318,
          157,
          299
        ],
        "alphaBounds": [
          873,
          320,
          153,
          295
        ],
        "usage": "runtime",
        "target": [
          -19.37012987,
          -70.474576271,
          38.74025974,
          70.949152542
        ],
        "anchors": {
          "ground": {
            "source": [
              949.5,
              615
            ],
            "world": [
              0,
              0
            ]
          }
        }
      },
      "terminal-done": {
        "cell": [
          0,
          627,
          627,
          313
        ],
        "source": [
          244,
          632,
          157,
          299
        ],
        "alphaBounds": [
          246,
          634,
          153,
          295
        ],
        "usage": "runtime",
        "target": [
          -19.37012987,
          -70.474576271,
          38.74025974,
          70.949152542
        ],
        "anchors": {
          "ground": {
            "source": [
              322.5,
              929
            ],
            "world": [
              0,
              0
            ]
          }
        }
      },
      "terminal-destroyed": {
        "cell": [
          627,
          627,
          627,
          313
        ],
        "source": [
          849,
          725,
          185,
          201
        ],
        "alphaBounds": [
          851,
          727,
          181,
          197
        ],
        "usage": "reference",
        "target": [
          -22.824675325,
          -47.220338983,
          45.649350649,
          47.694915254
        ],
        "anchors": {
          "ground": {
            "source": [
              941.5,
              924
            ],
            "world": [
              0,
              0
            ]
          }
        }
      },
      "marker-imperial": {
        "cell": [
          0,
          940,
          627,
          314
        ],
        "source": [
          264,
          956,
          170,
          289
        ],
        "alphaBounds": [
          266,
          958,
          166,
          285
        ],
        "usage": "runtime",
        "target": [
          -31.234939759,
          -97.680701754,
          62.469879518,
          98.361403509
        ],
        "anchors": {
          "ground": {
            "source": [
              349.0,
              1243
            ],
            "world": [
              0,
              0
            ]
          }
        }
      },
      "marker-local": {
        "cell": [
          627,
          940,
          627,
          314
        ],
        "source": [
          820,
          952,
          233,
          294
        ],
        "alphaBounds": [
          822,
          954,
          229,
          290
        ],
        "usage": "runtime",
        "target": [
          -34.593886463,
          -97.668965517,
          69.187772926,
          98.337931034
        ],
        "anchors": {
          "ground": {
            "source": [
              936.5,
              1244
            ],
            "world": [
              0,
              0
            ]
          }
        }
      }
    }
  },
  "logistics": {
    "image": "assets/painted/route/logistics.png",
    "size": [
      1254,
      1254
    ],
    "grid": [
      2,
      3
    ],
    "rowBoundaries": [
      0,
      418,
      836,
      1254
    ],
    "frames": {
      "truck-normal": {
        "cell": [
          0,
          0,
          627,
          418
        ],
        "source": [
          44,
          54,
          544,
          312
        ],
        "alphaBounds": [
          46,
          56,
          540,
          308
        ],
        "usage": "runtime",
        "target": [
          -63.466666667,
          -68.441558442,
          126.933333333,
          68.883116883
        ],
        "anchors": {
          "ground": {
            "source": [
              316.0,
              364
            ],
            "world": [
              0,
              0
            ]
          }
        }
      },
      "truck-damaged": {
        "cell": [
          627,
          0,
          627,
          418
        ],
        "source": [
          670,
          54,
          548,
          312
        ],
        "alphaBounds": [
          672,
          56,
          544,
          308
        ],
        "usage": "runtime",
        "target": [
          -63.933333333,
          -68.441558442,
          127.866666667,
          68.883116883
        ],
        "anchors": {
          "ground": {
            "source": [
              944.0,
              364
            ],
            "world": [
              0,
              0
            ]
          }
        }
      },
      "truck-destroyed": {
        "cell": [
          0,
          418,
          627,
          418
        ],
        "source": [
          34,
          493,
          562,
          280
        ],
        "alphaBounds": [
          36,
          495,
          558,
          276
        ],
        "usage": "runtime",
        "target": [
          -65.566666667,
          -61.376623377,
          131.133333333,
          61.818181818
        ],
        "anchors": {
          "ground": {
            "source": [
              315.0,
              771
            ],
            "world": [
              0,
              0
            ]
          }
        }
      },
      "wheel-reference": {
        "cell": [
          627,
          418,
          627,
          418
        ],
        "source": [
          775,
          447,
          330,
          332
        ],
        "alphaBounds": [
          777,
          449,
          326,
          328
        ],
        "usage": "reference",
        "target": [
          -13.159509202,
          -26.158536585,
          26.319018405,
          26.317073171
        ],
        "anchors": {
          "ground": {
            "source": [
              940.0,
              777
            ],
            "world": [
              0,
              0
            ]
          }
        }
      },
      "light-off": {
        "cell": [
          0,
          836,
          627,
          418
        ],
        "source": [
          218,
          846,
          191,
          381
        ],
        "alphaBounds": [
          220,
          848,
          187,
          377
        ],
        "usage": "runtime",
        "target": [
          -22.470588235,
          -138.732095491,
          44.941176471,
          139.464190981
        ],
        "anchors": {
          "ground": {
            "source": [
              313.5,
              1225
            ],
            "world": [
              0,
              0
            ]
          }
        }
      },
      "light-on": {
        "cell": [
          627,
          836,
          627,
          418
        ],
        "source": [
          845,
          845,
          191,
          382
        ],
        "alphaBounds": [
          847,
          847,
          187,
          378
        ],
        "usage": "runtime",
        "target": [
          -22.470588235,
          -138.73015873,
          44.941176471,
          139.46031746
        ],
        "anchors": {
          "ground": {
            "source": [
              940.5,
              1225
            ],
            "world": [
              0,
              0
            ]
          }
        }
      }
    }
  }
};
