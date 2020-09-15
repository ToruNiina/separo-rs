use wasm_bindgen::prelude::*;
use std::rc::Rc;
use std::cell::RefCell;
use gif::SetParameter;

struct ToVecRefWriter {
    inner: Rc<RefCell<Vec<u8>>>,
}
impl std::io::Write for ToVecRefWriter {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        self.inner.borrow_mut().write(buf)
    }
    fn flush(&mut self) -> std::io::Result<()> {
        self.inner.borrow_mut().flush()
    }
}

#[wasm_bindgen]
pub struct GameGifRecorder {
    png_buffer: Vec<u8>,
    gif_buffer: Rc<RefCell<Vec<u8>>>,
    gif_encoder: Option<gif::Encoder<ToVecRefWriter>>,
}

#[wasm_bindgen]
impl GameGifRecorder {
    pub fn new() -> Self {
        GameGifRecorder{
            png_buffer: Vec::new(),
            gif_buffer: Rc::new(RefCell::new(Vec::new())),
            gif_encoder: None,
        }
    }
    pub fn add_frame(&mut self, img: String) {
        let content: Vec<u8> = base64::decode(
            img.trim_start_matches("data:image/png;base64,")).unwrap();
        let decoder = png::Decoder::new(&content[..]);
        let (info, mut reader) = decoder.read_info().unwrap();
        self.png_buffer.resize(info.buffer_size(), 0);
        reader.next_frame(&mut self.png_buffer).unwrap();

        if self.gif_encoder.is_none() {
            self.gif_encoder = Some(gif::Encoder::new(
                ToVecRefWriter{inner: Rc::clone(&self.gif_buffer)},
                info.width as u16,
                info.height as u16,
                &[]).unwrap());
            self.gif_encoder.as_mut().unwrap().set(gif::Repeat::Infinite).unwrap();
        }
        let mut frame = gif::Frame::from_rgba_speed(
            info.width as u16, info.height as u16, &mut self.png_buffer, 20);
        frame.delay = 100;

        self.gif_encoder.as_mut().unwrap().write_frame(&frame).unwrap();
    }

    pub fn dump(&self) -> String {
        base64::encode(&*self.gif_buffer.borrow())
    }
}

