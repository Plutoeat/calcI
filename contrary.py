#!/usr/bin/env python
# -*- coding: UTF-8 -*-
"""
@Project: calcI
@File: contrary.py
@IDE: PyCharm
@Author: paidaxing
@Date: 2024/8/18 20:52
"""
import math
import numpy_financial as npf
from scipy.optimize import fsolve


def acpi_func(r, loan_principal, monthly_payment, periods):
    return loan_principal * r * (1 + r) ** periods / ((1 + r) ** periods - 1) - monthly_payment


def average_capital_plus_interest(loan_principal: int, monthly_payment: float, periods: int) -> None:
    """
    等额本息
    :param loan_principal: 贷款金额
    :param monthly_payment: 每月偿还金额(元)
    :param periods: 贷款月周期
    :return: None
    """
    interest_rate = fsolve(acpi_func, 0.01,args=(loan_principal, monthly_payment, periods))
    cash_flow = [-loan_principal] + [monthly_payment] * periods
    irr = npf.irr(cash_flow)
    apr = (1 + irr) ** 12 - 1
    print('===> 总利息 {:>,.2f} 元'.format(monthly_payment * periods - loan_principal))
    for i in range(1, periods):
        interest = loan_principal * interest_rate
        capital = monthly_payment - interest
        loan_principal = loan_principal - capital
        print('===> 第 {} 月: 偿还利息 {:>,.2f} 元 偿还本金 {:>,.2f} 元 还款额 {:>,.2f} 元, '.format(i, interest, capital,monthly_payment))
    print('===> 内含报酬率为：{:>,.2%}'.format(irr))
    print('===> 月利率 {:>,.2%} 年利率 {:>,.2%} 年利化率为：{:>,.2%}'.format(interest_rate, interest_rate * 12, apr))


def equal_capital_and_interest(loan_principal: int, monthly_payment: float, periods: int) -> None:
    """
    等本等息
    :param loan_principal: 贷款金额
    :param monthly_payment: 每月偿还金额(元)
    :param periods: 贷款月周期
    :return: None
    """
    b = loan_principal / periods
    i = monthly_payment - b
    interest_rate = i / loan_principal
    print('===> 总利息 {:>,.2f} 元'.format(i * periods))
    print('===> 每月偿还本金为 {:>,.2f} 元 利息 {:>,.2f} 元 还款额 {:>,.2f} 元'.format(b, i, monthly_payment))
    cash_flow = [-loan_principal] + [monthly_payment] * periods
    irr = npf.irr(cash_flow)
    print('===> 内含报酬率为：{:>,.2f}'.format(irr))
    apr = (1 + irr) ** 12 - 1
    print('===> 月利率 {:>,.2%} 年利率 {:>,.2%} 年利化率为：{:>,.2%}'.format(interest_rate, interest_rate * 12, apr))


def interest_before_capital(loan_principal: int, interest_rate: float, periods: int) -> None:
    print('该还款方式仅还利息，到期一次性偿还本金')
    monthly_payment = loan_principal * interest_rate
    print('===> 月还款额为：{:>,.2f} 元'.format(monthly_payment))
    apr = interest_rate
    print('===> 年利化率为：{:>,.2f}'.format(apr))


def repay_the_principal_and_interest_at_one_time(loan_principal: int, interest_rate: float, periods: int) -> None:
    print('该还款方式为一次性偿还本金和全部利息')
    monthly_payment = loan_principal * math.ceil(periods / 12) * interest_rate * 12
    print('===> 总利息为：{:>,.2f} 元'.format(monthly_payment))
    apr = interest_rate
    print('===> 年利化率为：{:>,.2f}'.format(apr))


def interest_equal_increment(loan_principal: int, interest_rate: float, periods: int) -> None:
    print('该还款方式是每月逐渐递增或递减')
    increment = float(input('请输入每月还款额递增额：'))
    cash_flow = [-loan_principal]
    a1 = (loan_principal - (periods * (periods - 1) * increment) / 2) / periods
    for i in range(1, periods + 1):
        print('===> 第 {} 月还款额为：{:>,.2f} 元'.format(i, a1 - increment * (i - 1)))
        cash_flow = cash_flow + [a1 - increment * (i - 1)]
    irr = npf.irr(cash_flow)
    print('===> 内含报酬率为：{:>,.2f}'.format(irr))
    apr = (1 + irr) ** 12 - 1
    print('===> 年利化率为：{:>,.2f}'.format(apr))


if __name__ == '__main__':
    print('以月还为基础计算，其他周期利率请勿使用'.center(80, '='))
    loan_principal = int(input('请输入贷款本金：'))
    monthly_payment = float(input('请输入每月偿还金额(元)：'))
    periods = int(input('请输入分期期数：'))
    method = input(
        '请输入还款方式:\n(1) 月等额本息\n(2) 月等额本金 - 不可用\n(3) 月等本等息\n(4) 先息后本\n(5) 一次性还本付息\n')
    if method == '1':
        average_capital_plus_interest(loan_principal, monthly_payment, periods)
    elif method == '2':
        print('不可用')
    elif method == '3':
        equal_capital_and_interest(loan_principal, monthly_payment, periods)
    elif method == '4':
        print('可手动简单算出')
    elif method == '5':
        print('不需要计算，一次还清')
    else:
        print("若你还款方式为随借随还，请自行计算利息，年利化率等于年利率")
