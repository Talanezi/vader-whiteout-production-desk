//! Whiteout browser bridge. Geometry/brush kernel is the pinned VectorCraft subset.
//! No application UI or network/storage code. Bounded JSON input and deterministic SVG output.
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use vectorcraft_brush::{Brush, BrushKind, Calligraphic, Variation, node_bezpath, stroke_pieces};
use vectorcraft_color::{Color, Paint};
use vectorcraft_doc::{Document, PressureProfile, StrokeLayer};
use vectorcraft_geom::{Affine, BezPath, PathData, Point, Rect, Shape};
thread_local! {static INPUT:RefCell<Vec<u8>>=const{RefCell::new(Vec::new())};static OUTPUT:RefCell<Vec<u8>>=const{RefCell::new(Vec::new())};}
#[derive(Deserialize)]
struct Request {
    op: String,
    #[serde(default)]
    points: Vec<[f64; 3]>,
    #[serde(default = "default_width")]
    width: f64,
    #[serde(default)]
    path: String,
    #[serde(default)]
    matrix: Option<[f64; 6]>,
}
fn default_width() -> f64 {
    4.0
}
#[derive(Serialize)]
struct Geometry {
    path: String,
    bounds: [f64; 4],
    fill: bool,
    engine: &'static str,
}
fn geometry(req: Request) -> Result<Geometry, String> {
    if req.points.len() > 4096
        || !req.width.is_finite()
        || req.width < 0.1
        || req.width > 200.0
        || req
            .points
            .iter()
            .flatten()
            .any(|n| !n.is_finite() || n.abs() > 1e6)
    {
        return Err("Invalid drawing geometry".into());
    }
    let pts: Vec<Point> = req.points.iter().map(|p| Point::new(p[0], p[1])).collect();
    let mut fill = false;
    let mut bp = match req.op.as_str() {
        "transform" => {
            if req.path.len() > 500_000 {
                return Err("Path is too large".into());
            }
            let path = BezPath::from_svg(&req.path).map_err(|_| "Invalid path")?;
            let matrix = req.matrix.ok_or("Transform required")?;
            if matrix.iter().any(|x| !x.is_finite() || x.abs() > 1e6) {
                return Err("Invalid transform".into());
            }
            let mut data = PathData::from_bezpath(&path);
            data.transform(Affine::new(matrix));
            data.to_bezpath()
        }
        "rectangle" | "ellipse" | "callout" => {
            let a = pts.first().ok_or("Start point required")?;
            let b = pts.last().ok_or("End point required")?;
            let r = Rect::new(a.x, a.y, b.x, b.y).abs();
            match req.op.as_str() {
                "ellipse" => vectorcraft_geom::shapes::ellipse(r).to_bezpath(),
                "callout" => PathData::single(vectorcraft_geom::SubPath::polyline(
                    &[
                        Point::new(r.x0, r.y0),
                        Point::new(r.x1, r.y0),
                        Point::new(r.x1, r.y1),
                        Point::new(r.x0 + r.width() * 0.60, r.y1),
                        Point::new(
                            r.x0 + r.width() * 0.35,
                            r.y1 + (r.height() * 0.25).min(30.0),
                        ),
                        Point::new(r.x0 + r.width() * 0.40, r.y1),
                        Point::new(r.x0, r.y1),
                    ],
                    true,
                ))
                .to_bezpath(),
                _ => vectorcraft_geom::shapes::rectangle(r).to_bezpath(),
            }
        }
        "line" => {
            let a = *pts.first().ok_or("Start point required")?;
            let b = *pts.last().ok_or("End point required")?;
            vectorcraft_geom::shapes::line(a, b).to_bezpath()
        }
        "bezier" => {
            if pts.is_empty() || (pts.len() - 1) % 3 != 0 {
                return Err("A path requires anchors and paired Bézier controls".into());
            }
            let mut p = BezPath::new();
            p.move_to(pts[0]);
            for segment in pts[1..].chunks_exact(3) {
                p.curve_to(segment[0], segment[1], segment[2]);
            }
            p
        }
        "curve" | "arrow" => {
            let a = *pts.first().ok_or("Start point required")?;
            let b = *pts.last().ok_or("End point required")?;
            let c = *pts.get(1).unwrap_or(&a);
            let mut p = BezPath::new();
            p.move_to(a);
            p.curve_to(a + (c - a) * (2.0 / 3.0), b + (c - b) * (2.0 / 3.0), b);
            p
        }
        "brush" | "highlight" => {
            let a = *pts.first().ok_or("Start point required")?;
            let mut center = BezPath::new();
            center.move_to(a);
            if pts.len() == 1 {
                center.line_to(Point::new(a.x + 0.01, a.y))
            } else {
                for i in 0..pts.len() - 1 {
                    let before = pts[i.saturating_sub(1)];
                    let start = pts[i];
                    let end = pts[i + 1];
                    let after = *pts.get(i + 2).unwrap_or(&end);
                    center.curve_to(
                        start + (end - before) / 6.0,
                        end - (after - start) / 6.0,
                        end,
                    )
                }
            }
            let pressure = req.op == "brush";
            let brush = Brush {
                name: "Whiteout round".into(),
                kind: BrushKind::Calligraphic(Calligraphic {
                    size: 1.0,
                    variation: [0.0, 0.0, if pressure { 0.75 } else { 0.0 }],
                    modes: Some([Variation::Fixed, Variation::Fixed, Variation::Pressure]),
                    ..Default::default()
                }),
            };
            let mut stroke = StrokeLayer::new(Paint::solid(Color::BLACK), req.width);
            let mut distance = vec![0.0];
            for pair in pts.windows(2) {
                distance.push(distance.last().copied().unwrap_or(0.0) + pair[0].distance(pair[1]))
            }
            let total = distance.last().copied().unwrap_or(1.0).max(1e-6);
            stroke.pressure = Some(PressureProfile {
                points: req
                    .points
                    .iter()
                    .enumerate()
                    .map(|(i, p)| {
                        (
                            distance.get(i).copied().unwrap_or(0.0) / total,
                            p[2].clamp(0.0, 1.0),
                        )
                    })
                    .collect(),
            });
            let nodes = stroke_pieces(&Document::new(1000.0, 1000.0), &brush, &center, &stroke);
            let mut p = BezPath::new();
            for n in nodes {
                if let Some(path) = node_bezpath(&n) {
                    p.extend(path)
                }
            }
            fill = true;
            p
        }
        _ => return Err("Unknown drawing operation".into()),
    };
    // Round-trip through the actual editable VectorCraft model for all operations.
    bp = PathData::from_bezpath(&bp).to_bezpath();
    let r = bp.bounding_box();
    Ok(Geometry {
        path: bp.to_svg(),
        bounds: [r.x0, r.y0, r.x1, r.y1],
        fill,
        engine: "vectorcraft-639c9d6-v1",
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn reserve_input(len: usize) -> *mut u8 {
    if len > 1_000_000 {
        return std::ptr::null_mut();
    }
    INPUT.with(|i| {
        let mut i = i.borrow_mut();
        i.resize(len, 0);
        i.as_mut_ptr()
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn run() -> u32 {
    let result = INPUT.with(|i| {
        serde_json::from_slice::<Request>(&i.borrow())
            .map_err(|_| "Invalid engine request".to_string())
            .and_then(geometry)
    });
    let ok = result.is_ok();
    let output = match result {
        Ok(g) => serde_json::to_vec(&g),
        Err(error) => serde_json::to_vec(&serde_json::json!({"error":error})),
    }
    .unwrap_or_default();
    OUTPUT.with(|o| *o.borrow_mut() = output);
    u32::from(ok)
}
#[unsafe(no_mangle)]
pub extern "C" fn output_ptr() -> *const u8 {
    OUTPUT.with(|o| o.borrow().as_ptr())
}
#[unsafe(no_mangle)]
pub extern "C" fn output_len() -> usize {
    OUTPUT.with(|o| o.borrow().len())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn pressure_and_determinism() {
        let r = |p: f64| Request {
            op: "brush".into(),
            points: vec![[0.0, 0.0, p], [100.0, 50.0, p]],
            width: 12.0,
            path: String::new(),
            matrix: None,
        };
        let a = geometry(r(0.1)).unwrap();
        let b = geometry(r(1.0)).unwrap();
        assert_ne!(a.path, b.path);
        assert_eq!(a.path, geometry(r(0.1)).unwrap().path);
    }
    #[test]
    fn invalid_is_rejected() {
        assert!(
            geometry(Request {
                op: "line".into(),
                points: vec![],
                width: 4.0,
                path: String::new(),
                matrix: None
            })
            .is_err()
        )
    }
}
