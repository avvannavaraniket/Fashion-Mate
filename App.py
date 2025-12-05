import json
from typing import Dict, Any, List

import streamlit as st

# Optional: if you want to actually call Gemini from Python.
# 1) pip install google-generativeai
# 2) Put your key in .streamlit/secrets.toml:
#    GEMINI_API_KEY = "your_key_here"
try:
    import google.generativeai as genai
    api_key = st.secrets.get("GEMINI_API_KEY", "")
    if api_key:
        genai.configure(api_key=api_key)
        GEMINI_ENABLED = True
    else:
        GEMINI_ENABLED = False
except Exception:
    GEMINI_ENABLED = False


# ------------------ CONFIG ------------------ #

OCCASION_MIN_LENGTH = 5
OCCASION_MAX_LENGTH = 300
PREFERENCES_MAX_LENGTH = 200

SUGGESTED_OCCASIONS = [
    "Casual Coffee Date",
    "Summer Wedding Guest",
    "Tech Job Interview",
    "Weekend Brunch",
    "Gallery Opening",
    "Cocktail Party",
]

GENDER_OPTIONS = ["Female", "Male", "Non-Binary"]


# ------------------ GEMINI CALL ------------------ #

def get_outfit_recommendation(
    occasion: str,
    gender: str,
    preferences: str,
) -> Dict[str, Any]:
    """
    Call Gemini (if enabled) or return a sample response
    shaped like your Google Studio StylistResponse.
    """
    if not GEMINI_ENABLED:
        # Dummy fallback so UI works even without API
        return {
            "primary_outfit": {
                "title": "Soft Cocktail Evening",
                "top": "Satin camisole in muted blush with delicate straps.",
                "bottom": "High-waisted tailored trousers in warm beige.",
                "footwear": "Strappy block-heel sandals in nude.",
                "accessories": [
                    "Minimal gold necklace",
                    "Structured mini clutch",
                    "Thin gold bracelet",
                ],
                "reasoning": "Elegant yet comfortable, suitable for most semi-formal occasions and easy to personalize with makeup and hair.",
            },
            "additional_suggestions": [
                {
                    "label": "Casual Alternative",
                    "outfit_summary": "Relaxed linen shirt, straight-leg jeans, and white sneakers with a canvas tote.",
                },
                {
                    "label": "Trendier Option",
                    "outfit_summary": "Cropped blazer, wide-leg pants, chunky loafers, and a mini shoulder bag.",
                },
                {
                    "label": "Budget-Friendly Choice",
                    "outfit_summary": "Solid tee, black jeans, simple flats, and a small crossbody bag.",
                },
            ],
            "styling_notes": "Keep accessories minimal and let one element stand out—either your bag, shoes, or earrings.",
        }

    prompt = f"""
You are an AI stylist. Follow the system rules already given for this project.

User outfit request:
- Occasion / event: "{occasion}"
- Style focus (gender): {gender}
- Extra preferences: "{preferences or "None"}"

Return ONLY valid JSON matching exactly this shape:
{{
  "primary_outfit": {{
    "title": "string",
    "top": "string",
    "bottom": "string",
    "footwear": "string",
    "accessories": ["string"],
    "reasoning": "string"
  }},
  "additional_suggestions": [
    {{
      "label": "string",
      "outfit_summary": "string"
    }}
  ],
  "styling_notes": "string"
}}
"""

    model = genai.GenerativeModel("gemini-1.5-flash")
    resp = model.generate_content(prompt)
    text = resp.text.strip()

    # Try parsing raw JSON or JSON inside ``` blocks
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            return json.loads(text[start : end + 1])
        raise ValueError("Could not parse JSON from model response.")


# ------------------ VALIDATION ------------------ #

def validate_occasion(value: str) -> str:
    trimmed = value.strip()
    if not trimmed:
        return "Please describe the occasion."
    if len(trimmed) < OCCASION_MIN_LENGTH:
        return f"At least {OCCASION_MIN_LENGTH} chars needed."
    if len(trimmed) > OCCASION_MAX_LENGTH:
        return f"Limit to {OCCASION_MAX_LENGTH} characters."
    return ""


def validate_gender(value: str) -> str:
    if not value.strip():
        return "Required."
    return ""


def validate_preferences(value: str) -> str:
    if len(value) > PREFERENCES_MAX_LENGTH:
        return f"Limit to {PREFERENCES_MAX_LENGTH} characters."
    return ""


# ------------------ DISPLAY RESULT ------------------ #

def display_outfit(data: Dict[str, Any]) -> None:
    primary = data.get("primary_outfit", {}) or {}
    suggestions: List[Dict[str, Any]] = data.get("additional_suggestions", []) or []
    styling_notes: str = data.get("styling_notes", "")

    st.markdown("## ✨ Your Curated Look")

    with st.container():
        st.markdown(
            """
            <div class="card primary-card">
              <div class="pill">Primary Outfit</div>
            """,
            unsafe_allow_html=True,
        )
        st.markdown(
            f"<h2 class='primary-title'>{primary.get('title','Curated Look')}</h2>",
            unsafe_allow_html=True,
        )

        c1, c2 = st.columns(2)
        with c1:
            st.markdown("**Top**")
            st.write(primary.get("top", "—"))
            st.markdown("**Bottom**")
            st.write(primary.get("bottom", "—"))
        with c2:
            st.markdown("**Footwear**")
            st.write(primary.get("footwear", "—"))
            st.markdown("**Accessories**")
            acc = primary.get("accessories") or []
            if isinstance(acc, list) and acc:
                st.write(", ".join(acc))
            else:
                st.write("—")

        st.markdown("**Why this works**")
        st.write(primary.get("reasoning", ""))

        st.markdown("</div>", unsafe_allow_html=True)

    if suggestions:
        st.markdown("### 🌈 More Options")
        cols = st.columns(min(3, len(suggestions)))
        for col, sug in zip(cols, suggestions):
            with col:
                st.markdown(
                    f"""
                    <div class="card alt-card">
                      <div class="alt-label">{sug.get("label","")}</div>
                      <p>{sug.get("outfit_summary","")}</p>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

    if styling_notes:
        st.markdown("### 📝 Styling Notes")
        st.markdown(
            f"<div class='card notes-card'>{styling_notes}</div>",
            unsafe_allow_html=True,
        )


# ------------------ MAIN APP ------------------ #

def main():
    st.set_page_config(
        page_title="FashionMate – AI Stylist",
        page_icon="👗",
        layout="centered",
    )

    # Elegant, colorful background + cards (similar vibe to your React CSS)
    st.markdown(
        """
        <style>
        .stApp {
            background:
              radial-gradient(circle at -10% -10%, rgba(254, 226, 226, 0.8), transparent 60%),
              radial-gradient(circle at 110% 0%, rgba(255, 237, 213, 0.8), transparent 60%),
              radial-gradient(circle at 20% 120%, rgba(224, 231, 255, 0.8), transparent 60%),
              #faf5f1;
            color: #1f2933;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
        }
        .card {
            border-radius: 1.75rem;
            padding: 1.5rem 1.7rem;
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.9);
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
            backdrop-filter: blur(16px);
        }
        .primary-card {
            border: 1px solid rgba(15, 23, 42, 0.08);
        }
        .alt-card {
            font-size: 0.9rem;
            line-height: 1.4;
        }
        .notes-card {
            font-size: 0.95rem;
            border-style: dashed;
            border-color: rgba(148, 163, 184, 0.6);
        }
        .pill {
            display: inline-flex;
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            padding: 0.35rem 0.9rem;
            border-radius: 999px;
            background: rgba(248, 250, 252, 0.96);
            border: 1px solid rgba(226, 232, 240, 0.9);
            color: #6b7280;
            margin-bottom: 0.7rem;
        }
        .primary-title {
            font-family: "Times New Roman", ui-serif;
            font-size: 1.7rem;
            margin-bottom: 1.1rem;
        }
        .alt-label {
            font-weight: 600;
            font-size: 0.85rem;
            margin-bottom: 0.35rem;
            color: #334155;
        }
        .hero-title {
            font-family: "Times New Roman", ui-serif;
            font-size: clamp(2.3rem, 6vw, 3.9rem);
            line-height: 1.05;
            margin-bottom: 0.4rem;
        }
        .hero-sub {
            font-style: italic;
            color: #6b7280;
        }
        .hero-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.3rem 0.85rem;
            border-radius: 999px;
            border: 1px solid rgba(209, 213, 219, 0.9);
            background: rgba(255, 255, 255, 0.7);
            font-size: 0.65rem;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #6b7280;
        }
        .helper-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: #9ca3af;
        }
        textarea, input {
            font-family: inherit;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

    # ---- Session state ---- #
    if "occasion" not in st.session_state:
        st.session_state.occasion = ""
    if "gender" not in st.session_state:
        st.session_state.gender = ""
    if "preferences" not in st.session_state:
        st.session_state.preferences = ""
    if "result" not in st.session_state:
        st.session_state.result = None
    if "error" not in st.session_state:
        st.session_state.error = ""

    # ---- Header ---- #
    top = st.container()
    with top:
        c1, c2 = st.columns([2, 1])
        with c1:
            st.markdown(
                "<div style='font-weight:700; font-size:1.1rem;'>FashionMate</div>",
                unsafe_allow_html=True,
            )
        with c2:
            if st.session_state.result:
                if st.button("🔁 New Style", use_container_width=True):
                    st.session_state.occasion = ""
                    st.session_state.gender = ""
                    st.session_state.preferences = ""
                    st.session_state.result = None
                    st.session_state.error = ""

    st.markdown("---")

    # ---- Form / Main ---- #
    if not st.session_state.result:
        st.markdown(
            """
            <div style="text-align:center; margin-bottom: 2.5rem;">
              <div class="hero-pill">AI Personal Stylist</div>
              <h1 class="hero-title">Curate your look for<br/><span class="hero-sub">any occasion.</span></h1>
            </div>
            """,
            unsafe_allow_html=True,
        )

        with st.form("styling_form"):
            # Occasion
            st.markdown(
                "<div class='helper-label'>I'm dressing for...</div>",
                unsafe_allow_html=True,
            )
            st.session_state.occasion = st.text_area(
                "",
                value=st.session_state.occasion,
                height=90,
                placeholder="e.g., A minimalist summer wedding in Italy...",
            )
            occ_error = validate_occasion(st.session_state.occasion)
            cols = st.columns([3, 1])
            with cols[0]:
                if occ_error:
                    st.markdown(
                        f"<span style='color:#f97373; font-size:0.8rem;'>{occ_error}</span>",
                        unsafe_allow_html=True,
                    )
            with cols[1]:
                st.markdown(
                    f"<div style='text-align:right; font-size:0.7rem; color:#9ca3af;'>{len(st.session_state.occasion)}/{OCCASION_MAX_LENGTH}</div>",
                    unsafe_allow_html=True,
                )

            st.write("")

            # Gender & preferences side-by-side
            gc, pc = st.columns(2)
            with gc:
                st.markdown(
                    "<div class='helper-label'>Style archetype</div>",
                    unsafe_allow_html=True,
                )
                # Use radio for a clean selection
                st.session_state.gender = st.radio(
                    "",
                    GENDER_OPTIONS,
                    horizontal=True,
                    index=GENDER_OPTIONS.index(st.session_state.gender)
                    if st.session_state.gender in GENDER_OPTIONS
                    else 0,
                )
                gender_error = validate_gender(st.session_state.gender)
                if gender_error:
                    st.markdown(
                        f"<span style='color:#f97373; font-size:0.8rem;'>{gender_error}</span>",
                        unsafe_allow_html=True,
                    )

            with pc:
                st.markdown(
                    "<div class='helper-label'>Refinements (optional)</div>",
                    unsafe_allow_html=True,
                )
                st.session_state.preferences = st.text_input(
                    "",
                    value=st.session_state.preferences,
                    placeholder="No heels, love linen...",
                )
                pref_error = validate_preferences(st.session_state.preferences)
                if pref_error:
                    st.markdown(
                        f"<span style='color:#f97373; font-size:0.8rem;'>{pref_error}</span>",
                        unsafe_allow_html=True,
                    )

            is_valid = not occ_error and not gender_error and not pref_error

            submit = st.form_submit_button(
                "✨ Generate",
                disabled=not is_valid,
            )

        # Suggestion chips
        st.write("")
        st.markdown("###### Try a quick occasion")
        chip_cols = st.columns(3)
        for i, text in enumerate(SUGGESTED_OCCASIONS):
            with chip_cols[i % 3]:
                if st.button(text, key=f"sugg_{i}"):
                    st.session_state.occasion = text

        if submit and is_valid:
            with st.spinner("Designing..."):
                try:
                    data = get_outfit_recommendation(
                        st.session_state.occasion,
                        st.session_state.gender,
                        st.session_state.preferences,
                    )
                    st.session_state.result = data
                    st.session_state.error = ""
                except Exception as e:
                    st.session_state.error = str(e)

    # Error
    if st.session_state.error and not st.session_state.result:
        st.error(f"Unable to style: {st.session_state.error}")

    # Result
    if st.session_state.result:
        display_outfit(st.session_state.result)


if __name__ == "__main__":
    main()