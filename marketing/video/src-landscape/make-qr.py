"""Regenerate qr.svg (scan target of the end card). Needs: pip install qrcode"""
import qrcode, qrcode.image.svg, os
URL = "https://syedanwaarullah.com/maths3g/"
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0, box_size=10)
qr.add_data(URL); qr.make(fit=True)
m = qr.get_matrix(); n = len(m)
path = "".join(f"M{x} {y}h1v1h-1z" for y, row in enumerate(m) for x, v in enumerate(row) if v)
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" shape-rendering="crispEdges"><path fill="#1b2a4a" d="{path}"/></svg>\n'
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "qr.svg"), "w").write(svg)
print("modules", n)
