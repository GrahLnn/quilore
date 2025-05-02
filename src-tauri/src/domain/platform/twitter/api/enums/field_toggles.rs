use super::super::core::param_builder::Flag;

pub enum FieldToggles {
    WithArticlePlainText,
}

impl Flag for FieldToggles {
    fn as_str(&self) -> &'static str {
        match self {
            FieldToggles::WithArticlePlainText => "withArticlePlainText",
        }
    }
}
