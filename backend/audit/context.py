import contextvars

_current_user = contextvars.ContextVar("current_user", default=None)
_current_ip = contextvars.ContextVar("current_ip", default=None)
_current_ua = contextvars.ContextVar("current_ua", default=None)

def set_current_request_data(user, ip, ua):
    _current_user.set(user)
    _current_ip.set(ip)
    _current_ua.set(ua)

def get_current_user():
    return _current_user.get()

def get_current_ip():
    return _current_ip.get()

def get_current_ua():
    return _current_ua.get()
